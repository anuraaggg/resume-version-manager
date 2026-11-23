process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const cloudinary = require("../src/config/cloudinary");
const Resume = require("../src/models/Resume");
const { processResumeDeletion } = require("../src/services/resume-deletion.service");

const originalDestroy = cloudinary.uploader.destroy;
const originalDeleteOne = Resume.deleteOne;
const originalUpdateOne = Resume.updateOne;
const originalConsoleError = console.error;

afterEach(() => {
  cloudinary.uploader.destroy = originalDestroy;
  Resume.deleteOne = originalDeleteOne;
  Resume.updateOne = originalUpdateOne;
  console.error = originalConsoleError;
});

test("keeps a failed asset deletion pending and schedules a retry", async () => {
  let deletionAttempted = false;
  let retryUpdate;
  const startedAt = Date.now();

  cloudinary.uploader.destroy = async () => {
    deletionAttempted = true;
    throw new Error("Cloudinary unavailable");
  };
  Resume.deleteOne = async () => {
    assert.fail("failed asset deletion must not remove its resume record");
  };
  Resume.updateOne = async (...args) => {
    retryUpdate = args;
  };
  console.error = () => {};

  await processResumeDeletion({
    _id: "resume-id",
    publicId: "asset-id",
    deletionAttempts: 0,
  });

  assert.equal(deletionAttempted, true);
  assert.deepEqual(retryUpdate[0], {
    _id: "resume-id",
    deletedAt: { $ne: null },
  });
  assert.equal(retryUpdate[1].$inc.deletionAttempts, 1);
  assert.ok(retryUpdate[1].$set.deletionRetryAt.getTime() >= startedAt + 59_000);
});

test("removes the tombstone when Cloudinary reports the asset already missing", async () => {
  let deletedFilter;

  cloudinary.uploader.destroy = async () => ({ result: "not found" });
  Resume.deleteOne = async (filter) => {
    deletedFilter = filter;
  };
  Resume.updateOne = async () => {
    assert.fail("successful cleanup must not schedule another retry");
  };

  await processResumeDeletion({
    _id: "resume-id",
    publicId: "asset-id",
    deletionAttempts: 1,
  });

  assert.deepEqual(deletedFilter, {
    _id: "resume-id",
    deletedAt: { $ne: null },
  });
});
