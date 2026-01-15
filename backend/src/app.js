const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const resumeRoutes = require("./routes/resume.routes");

const app = express();

// CORS: restrict to frontend origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

app.get("/", (req, res) => {
  res.send("Resume Version Manager API running");
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File size exceeds 10MB limit" });
  }

  // Multer file type error
  if (err.message && err.message.includes("Only PDF files are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
