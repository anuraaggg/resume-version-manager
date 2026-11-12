const Resume = require("../models/Resume");
const cloudinary = require("../config/cloudinary");

// ===============================
// Upload Resume (PDF, versioned)
// ===============================
exports.uploadResume = async (req, res) => {
  let uploadedPublicId;

  try {
    const { title, company, appliedDate, tags, notes } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const normalizedTitle = title.trim();
    const safeTitle = normalizedTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
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
          company: company || "",
          appliedDate: appliedDate || "",
          version: nextVersion,
          fileUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          notes: notes || "",
        });

        return res.status(201).json(resume);
      } catch (error) {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "raw",
          type: "authenticated",
        });
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
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "raw",
          type: "authenticated",
        });
      } catch (cleanupError) {
        console.error("UPLOAD CLEANUP ERROR:", cleanupError);
      }
    }
    res.status(500).json({ message: "Failed to upload resume" });
  }
};

// ===============================
// Get all resumes
// ===============================
exports.getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({
      appliedDate: -1,
      version: -1,
    });

    res.json(resumes);
  } catch (error) {
    console.error("GET RESUMES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch resumes" });
  }
};

// ===============================
// Get a short-lived signed URL to view/download a resume
// ===============================
exports.getResumeUrl = async (req, res) => {
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
    console.error("GET RESUME URL ERROR:", error);
    res.status(500).json({ message: "Failed to generate resume URL" });
  }
};

// ===============================
// Delete resume
// ===============================
exports.deleteResumeVersion = async (req, res) => {
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
    console.error("DELETE RESUME ERROR:", error);
    res.status(500).json({ message: "Failed to delete resume" });
  }
};
