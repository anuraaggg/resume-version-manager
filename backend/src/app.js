const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const resumeRoutes = require("./routes/resume.routes");

const app = express();

// Trust the first hop reverse proxy (Render/Railway/Heroku/etc.) so
// express-rate-limit sees the real client IP instead of the proxy's,
// and so it doesn't throw on the X-Forwarded-For header those hosts add.
app.set("trust proxy", 1);

// CORS: allow one or more frontend origins from env
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,https://resume-version-manager.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("combined"));
app.use(express.json());

// Rate limit for auth endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
});

// Rate limit for resume endpoints (100 requests per 15 minutes)
const resumeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/resumes", resumeLimiter, resumeRoutes);

app.get("/", (req, res) => {
  res.send("Resume Version Manager API running");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("REQUEST ERROR:", err);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File size exceeds 10MB limit" });
  }

  // Multer file type error
  if (err.message && err.message.includes("Only PDF files are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid request data" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "A resource with those values already exists" });
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return res.status(statusCode).json({
    message: statusCode < 500 && err.message ? err.message : "Internal server error",
  });
});

module.exports = app;
