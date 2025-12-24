const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      default: "",
    },

    // Stored as YYYY-MM (e.g. "2024-07")
    appliedDate: {
      type: String,
      default: "",
    },

    version: {
      type: Number,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
