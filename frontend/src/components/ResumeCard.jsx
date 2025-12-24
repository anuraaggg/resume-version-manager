export default function ResumeCard({ resume, onDelete }) {
  return (
    <div className="border p-3 rounded">
      <div className="font-medium">{resume.originalFileName || 'Resume'}</div>
      <div className="text-sm text-gray-500">{resume.version}</div>
      <a href={resume.url} target="_blank" rel="noreferrer" className="text-blue-600">View</a>
      <button onClick={() => onDelete?.(resume)} className="ml-2 text-red-600">Delete</button>
    </div>
  );
}
