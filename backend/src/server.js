require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { processPendingResumeDeletions } = require("./services/resume-deletion.service");

const PORT = process.env.PORT || 5000;
const DELETION_RETRY_INTERVAL_MS = 60 * 1000;

// Validate required env vars
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is not set");
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("ERROR: JWT_SECRET must be set and at least 32 characters long");
  process.exit(1);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  let deletionSweepRunning = false;
  const runDeletionSweep = async () => {
    if (deletionSweepRunning) return;

    deletionSweepRunning = true;
    try {
      await processPendingResumeDeletions();
    } catch (error) {
      console.error("RESUME DELETION SWEEP ERROR:", error);
    } finally {
      deletionSweepRunning = false;
    }
  };

  runDeletionSweep();
  const deletionRetryTimer = setInterval(runDeletionSweep, DELETION_RETRY_INTERVAL_MS);
  deletionRetryTimer.unref();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
