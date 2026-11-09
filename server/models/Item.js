
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: String,

    category: String,

    status: {
      type: String,
      enum: ["Lost", "Found", "Returned"],
      default: "Lost"
    },

    location: {
      type: String,
      required: true
    },

    date: String,

    contact: {
      type: String,
      required: true
    },

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    proofUrl: String,

    foundAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
