import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResumeDetails() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);

  useEffect(() => {
    api.get(`/resumes/${id}`).then((r) => setResume(r.data));
  }, [id]);

  if (!resume) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1>{resume.originalFileName}</h1>
      <div>Version: {resume.version}</div>
      <a href={resume.url} target="_blank" rel="noreferrer">Download</a>
    </div>
  );
}
