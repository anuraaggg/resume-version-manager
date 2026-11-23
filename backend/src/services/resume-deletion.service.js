const Resume = require("../models/Resume");
const cloudinary = require("../config/cloudinary");

const RETRY_BASE_DELAY_MS = 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const DELETION_BATCH_SIZE = 50;

const processResumeDeletion = async (resume) => {
  try {
    const result = await cloudinary.uploader.destroy(resume.publicId, {
      resource_type: "raw",
      type: "authenticated",
    });

    if (result?.result !== "ok" && result?.result !== "not found") {
      throw new Error(`Unexpected Cloudinary deletion result: ${result?.result || "unknown"}`);
    }

    await Resume.deleteOne({ _id: resume._id, deletedAt: { $ne: null } });
  } catch (error) {
    console.error("RESUME ASSET DELETION ERROR:", error);

    const attempts = (resume.deletionAttempts || 0) + 1;
    const retryDelay = Math.min(
      RETRY_BASE_DELAY_MS * (2 ** Math.min(attempts - 1, 10)),
      MAX_RETRY_DELAY_MS
    );

    try {
      await Resume.updateOne(
        { _id: resume._id, deletedAt: { $ne: null } },
        {
          $inc: { deletionAttempts: 1 },
          $set: { deletionRetryAt: new Date(Date.now() + retryDelay) },
        }
      );
    } catch (scheduleError) {
      console.error("RESUME DELETION RETRY SCHEDULE ERROR:", scheduleError);
    }
  }
};

const processPendingResumeDeletions = async () => {
  const pendingResumes = await Resume.find({
    deletedAt: { $ne: null },
    deletionRetryAt: { $lte: new Date() },
  })
    .sort({ deletionRetryAt: 1 })
    .limit(DELETION_BATCH_SIZE);

  for (const resume of pendingResumes) {
    await processResumeDeletion(resume);
  }
};

module.exports = {
  processPendingResumeDeletions,
  processResumeDeletion,
};
