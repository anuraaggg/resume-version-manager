const Resume = require("../models/Resume");
const cloudinary = require("../config/cloudinary");

const MAX_TITLE_LENGTH = 120;
const MAX_COMPANY_LENGTH = 120;
const MAX_NOTES_LENGTH = 5000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

const destroyUploadedAsset = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      type: "authenticated",
    });
  } catch (error) {
    console.error("UPLOAD CLEANUP ERROR:", error);
  }
};

// ===============================
// Upload Resume (PDF, versioned)
// ===============================
exports.uploadResume = async (req, res, next) => {
  let uploadedPublicId;

  try {
    const { title, company, appliedDate, tags, notes } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    if (!req.file.buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))) {
      return res.status(400).json({ message: "Uploaded file is not a valid PDF" });
    }

    const normalizedTitle = title.trim();
    if (normalizedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ message: "Title must be 120 characters or fewer" });
    }

    const normalizedCompany = typeof company === "string" ? company.trim() : "";
    if (normalizedCompany.length > MAX_COMPANY_LENGTH) {
      return res.status(400).json({ message: "Company must be 120 characters or fewer" });
    }

    const normalizedNotes = typeof notes === "string" ? notes.trim() : "";
    if (normalizedNotes.length > MAX_NOTES_LENGTH) {
      return res.status(400).json({ message: "Notes must be 5000 characters or fewer" });
    }

    if (appliedDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(appliedDate)) {
      return res.status(400).json({ message: "Applied date must use YYYY-MM format" });
    }

    const normalizedTags = typeof tags === "string"
      ? [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))]
      : [];
    if (
      normalizedTags.length > MAX_TAGS
      || normalizedTags.some((tag) => tag.length > MAX_TAG_LENGTH)
    ) {
      return res.status(400).json({ message: "Resume tags are too long or too numerous" });
    }

    const safeTitle = normalizedTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "resume";
    const streamUpload = (publicId) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            type: "authenticated",
            folder: "resumes",
            format: "pdf",
            public_id: publicId,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const latestResume = await Resume.findOne({
        userId: req.userId,
        title: normalizedTitle,
      }).sort({ version: -1 });
      const nextVersion = latestResume ? latestResume.version + 1 : 1;
      const publicId = `${req.userId}_${safeTitle}_v${nextVersion}`;
      const uploadResult = await streamUpload(publicId);
      uploadedPublicId = uploadResult.public_id;

      try {
        const resume = await Resume.create({
          userId: req.userId,
          title: normalizedTitle,
          company: normalizedCompany,
          appliedDate: appliedDate || "",
          version: nextVersion,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          tags: normalizedTags,
          notes: normalizedNotes,
        });

        return res.status(201).json(resume);
      } catch (error) {
        await destroyUploadedAsset(uploadedPublicId);
        uploadedPublicId = undefined;

        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    return res.status(409).json({ message: "Could not assign a unique resume version" });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    if (uploadedPublicId) {
      await destroyUploadedAsset(uploadedPublicId);
    }
    next(error);
  }
};

// ===============================
// Get all resumes
// ===============================
exports.getUserResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({
      appliedDate: -1,
      version: -1,
    });

    res.json(resumes);
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get a short-lived signed URL to view/download a resume
// ===============================
exports.getResumeUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const url = cloudinary.url(resume.publicId, {
      resource_type: "raw",
      type: "authenticated",
      format: "pdf",
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    });

    res.json({ url });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Delete resume
// ===============================
exports.deleteResumeVersion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Delete from Cloudinary
    if (resume.publicId) {
      try {
        await cloudinary.uploader.destroy(resume.publicId, {
          resource_type: "raw",
          type: "authenticated",
        });
      } catch (cloudinaryError) {
        console.warn("Failed to delete file from Cloudinary:", cloudinaryError);
      }
    }

    res.json({ message: "Resume version deleted" });
  } catch (error) {
    next(error);
  }
};
