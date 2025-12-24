const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const { uploadResume } = require("../controllers/resume.controller");

// upload resume
router.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  uploadResume
);

const { getUserResumes } = require("../controllers/resume.controller");

// get all resumes for dashboard
router.get("/", authMiddleware, getUserResumes);

const { deleteResumeVersion } = require("../controllers/resume.controller");

router.delete("/:id", authMiddleware, deleteResumeVersion);


module.exports = router;

    