
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

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
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp"]
        .includes(file.mimetype)
    );
  }
});

router.post(
  "/",
  protect,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload an image"
      });
    }

    res.status(201).json({
      url: "/uploads/" + req.file.filename
    });
  }
);

export default router;
