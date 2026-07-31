import { useEffect, useState } from "react";
import api from "../services/api";
import UploadResume from "../components/UploadResume";
import Squares from "../components/Squares";

/* Safe date formatter */
function formatMonthYear(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return "";

  const date = new Date(year, month - 1);
  return date.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [expandedTitles, setExpandedTitles] = useState({});

  const toggleExpanded = (title) =>
    setExpandedTitles((prev) => ({ ...prev, [title]: !prev[title] }));

  const fetchResumes = async () => {
    const res = await api.get("/resumes");
    setResumes(res.data);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resume version?")) return;
    await api.delete(`/resumes/${id}`);
    fetchResumes();
  };

  const handleView = async (id) => {
    // Open the tab synchronously (in the click's call stack) so browsers
    // don't treat the later navigation as a blocked popup.
    const viewer = window.open("", "_blank");
    const res = await api.get(`/resumes/${id}/url`);
    if (viewer) viewer.location = res.data.url;
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  /* Group by title */
  const resumesByTitle = resumes.reduce((acc, r) => {
    if (!acc[r.title]) acc[r.title] = [];
    acc[r.title].push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black py-10 relative">
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="rgba(255,255,255,0.05)"
        hoverFillColor="rgba(59,130,246,0.1)"
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Resume Dashboard
            </h1>
            <p className="text-gray-300 text-sm mt-1">Manage your resume versions</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="px-4 py-2 bg-black border border-gray-700 hover:border-purple-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            Logout
          </button>
        </div>

        {/* Upload */}
        <UploadResume onUpload={fetchResumes} />

        {/* Empty */}
        {resumes.length === 0 && (
          <div className="bg-black border border-gray-800 p-6 rounded-xl text-gray-300">
            No resumes uploaded yet.
          </div>
        )}

{/* GRID */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
  {Object.keys(resumesByTitle).map((title) => {
    const versions = [...resumesByTitle[title]].sort((a, b) => b.version - a.version);
    const latest = versions[0];
    const olderVersions = versions.slice(1);
    const isExpanded = expandedTitles[title];

    return (
      <div
        key={title}
        className="group bg-black rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-white/10"
      >
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-white truncate group-hover:text-gray-200 transition-colors">
              {title}
            </h2>
            <span className="text-xs text-gray-500 font-mono shrink-0 mt-1">v{latest.version}</span>
          </div>

          {(latest.company || latest.appliedDate) && (
            <p className="text-xs text-gray-400 mt-2 space-x-2">
              {latest.company && <span className="text-gray-200 font-medium">{latest.company}</span>}
              {latest.company && latest.appliedDate && <span>·</span>}
              {latest.appliedDate && <span>{formatMonthYear(latest.appliedDate)}</span>}
            </p>
          )}
        </div>

        {/* Tags */}
        {latest.tags?.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex flex-wrap gap-2">
              {latest.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-900 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {latest.notes && (
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-xs text-gray-400 font-semibold mb-2">Notes</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{latest.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={() => handleView(latest._id)}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95"
          >
            View
          </button>

          <button
            onClick={() => handleDelete(latest._id)}
            className="flex-1 px-4 py-2.5 bg-black border border-gray-700 hover:border-gray-600 text-white rounded-lg text-sm font-semibold transition-all transform hover:scale-105 active:scale-95"
          >
            Delete
          </button>
        </div>

        {/* Version history */}
        {olderVersions.length > 0 && (
          <div className="border-t border-gray-800">
            <button
              onClick={() => toggleExpanded(title)}
              className="w-full px-6 py-3 text-xs text-gray-400 hover:text-gray-200 flex items-center justify-between transition-colors"
            >
              <span>
                {isExpanded ? "Hide" : "Show"} {olderVersions.length} earlier version
                {olderVersions.length > 1 ? "s" : ""}
              </span>
              <span>{isExpanded ? "−" : "+"}</span>
            </button>

            {isExpanded && (
              <div className="divide-y divide-gray-900">
                {olderVersions.map((v) => (
                  <div key={v._id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-300 font-mono">v{v.version}</p>
                      {v.appliedDate && (
                        <p className="text-xs text-gray-500">{formatMonthYear(v.appliedDate)}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleView(v._id)}
                        className="px-3 py-1.5 text-xs bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white rounded-lg transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        className="px-3 py-1.5 text-xs bg-black hover:bg-gray-900 border border-gray-700 text-white rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  })}
</div>

      </div>
    </div>
  );
}
