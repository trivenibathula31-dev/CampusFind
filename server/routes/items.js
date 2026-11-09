
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

import Item from "../models/Item.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: "uploads/",

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp"]
        .includes(file.mimetype)
    );
  }
});

// GET ALL ITEMS
router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.title = {
        $regex: req.query.search,
        $options: "i"
      };
    }

    const items = await Item.find(query)
      .populate("reporter", "name email")
      .populate("foundBy", "name email")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// CREATE LOST OR FOUND REPORT
router.post("/", protect, async (req, res) => {
  try {
    const item = await Item.create({
      ...req.body,
      reporter: req.user.id
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// MARK LOST ITEM AS FOUND WITH PROOF
router.post(
  "/:id/found",
  protect,
  upload.single("proof"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Photo proof is required"
        });
      }

      const item = await Item.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          error: "Item not found"
        });
      }

      if (item.status !== "Lost") {
        return res.status(400).json({
          error: "Item is not currently Lost"
        });
      }

      if (
        String(item.reporter) ===
        String(req.user.id)
      ) {
        return res.status(400).json({
          error: "You cannot submit proof for your own report"
        });
      }

      item.status = "Found";
      item.foundBy = req.user.id;
      item.proofUrl =
        "/uploads/" + req.file.filename;
      item.foundAt = new Date();

      await item.save();

      // SEND EMAIL TO ORIGINAL REPORTER
      const reporter = await User.findById(
        item.reporter
      );

      const finder = await User.findById(
        req.user.id
      );

      let emailSent = false;

      if (
        reporter &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const transporter =
          nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(
              process.env.SMTP_PORT || 587
            ),
            secure:
              process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

        await transporter.sendMail({
          from:
            process.env.MAIL_FROM ||
            process.env.SMTP_USER,

          to: reporter.email,

          subject:
            `CampusFind: ${item.title} Found!`,

          text:
            `Hello ${reporter.name},\n\n` +
            `Your lost item "${item.title}" has been found.\n\n` +
            `Finder: ${finder.name}\n` +
            `Finder Email: ${finder.email}\n` +
            `Location: ${item.location}\n\n` +
            `Proof photo: http://localhost:5000${item.proofUrl}\n\n` +
            `Please contact the finder to collect your item.`
        });

        emailSent = true;
      }

      res.json({
        message: "Item marked Found",
        emailSent,
        item
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// MARK AS RETURNED
router.patch(
  "/:id/returned",
  protect,
  async (req, res) => {
    try {
      const item = await Item.findById(
        req.params.id
      );

      if (!item) {
        return res.status(404).json({
          error: "Item not found"
        });
      }

      if (
        String(item.reporter) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          error: "Only the original reporter can update this"
        });
      }

      if (item.status !== "Found") {
        return res.status(400).json({
          error: "Item must be Found first"
        });
      }

      item.status = "Returned";

      await item.save();

      res.json({
        message: "Item Returned successfully",
        item
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

// DELETE REPORT
router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const item = await Item.findById(
        req.params.id
      );

      if (!item) {
        return res.status(404).json({
          error: "Item not found"
        });
      }

      if (
        String(item.reporter) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          error: "You cannot delete this report"
        });
      }

      await item.deleteOne();

      res.json({
        message: "Report deleted"
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }
);

export default router;
