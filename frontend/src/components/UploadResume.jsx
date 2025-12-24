import { useState } from "react";
import api from "../services/api";

const COMMON_TAGS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "Full Stack",
  "REST API",
  "Database Design",
  "DevOps",
  "Cloud Architecture",
  "Machine Learning",
  "Data Science",
  "System Design",
  "Microservices",
  "Docker",
  "AWS",
  "GCP",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "GraphQL",
  "WebSockets",
  "Authentication",
  "Performance Optimization",
  "Internship",
  "Freelance",
  "Contract",
];

const toTitleCase = (str) => {
  return str.trim().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function UploadResume({ onUpload }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [tags, setTags] = useState([]);
  const [customTags, setCustomTags] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* Toggle preset tag */
  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  /* Add manual tags safely */
  const addCustomTags = () => {
    if (!customTags.trim()) return;

    const newTags = customTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !tags.includes(t));

    setTags((prev) => [...prev, ...newTags]);
    setCustomTags("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Title and PDF are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("company", company.trim());
    formData.append("appliedDate", appliedDate);
    formData.append("tags", tags.join(","));
    formData.append("notes", notes.trim());
    formData.append("resume", file);

    try {
      setLoading(true);
      await api.post("/resume/upload", formData);
      onUpload();

      setTitle("");
      setCompany("");
      setAppliedDate("");
      setTags([]);
      setCustomTags("");
      setNotes("");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-black border border-gray-800 rounded-xl shadow-lg p-5 mb-6"
    >
      <h2 className="text-lg font-bold text-white mb-4">Upload Resume</h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          placeholder="Resume Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTitle(toTitleCase(title))}
          className="bg-gray-950 border border-gray-800 text-white rounded-lg p-2 text-sm"
          required
        />
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onBlur={() => setCompany(toTitleCase(company))}
          className="bg-gray-950 border border-gray-800 text-white rounded-lg p-2 text-sm"
        />
        <input
          type="month"
          value={appliedDate}
          onChange={(e) => setAppliedDate(e.target.value)}
          className="bg-gray-950 border border-gray-800 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent [color-scheme:dark]"
        />
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 block mb-2">Tags</label>

        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 text-xs rounded-md border transition ${
                tags.includes(tag)
                  ? "bg-gray-800 text-white border-gray-600"
                  : "bg-black text-gray-400 border-gray-800 hover:border-gray-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Add custom tags (comma separated)"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
            onBlur={addCustomTags}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTags())}
            className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-lg p-2 text-sm"
          />
          <button
            type="button"
            onClick={addCustomTags}
            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg text-xs"
          >
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-900 border border-gray-700 px-2 py-1 rounded-md text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <textarea
        placeholder="Optional notes..."
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-2 text-sm mb-4 resize-none"
      />

      {/* File + Submit */}
      <div className="flex gap-3">
        <label className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-5 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-center">
          {file ? file.name : "Choose PDF"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white px-5 py-2 rounded-lg text-sm"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
