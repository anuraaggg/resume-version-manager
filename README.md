# Resume Version Manager

A full-stack app to manage and version resume uploads.

## Features
- Email/password auth with JWT (rate-limited to 5 attempts / 15 min)
- Versioned resume uploads (PDF only, 10MB max) stored privately in Cloudinary
- Time-limited signed URLs for viewing resumes — no public file access
- Rate-limited resume endpoints (100 req / 15 min) and sanitized error responses (no internal error details leak to clients)

## Structure
- backend: Express API with MongoDB, JWT, Cloudinary
- frontend: React + Vite UI, Tailwind-ready

## Quick Start
1. Configure backend `.env` (see backend/README.md).
2. Install dependencies (backend and frontend).
3. Run backend and frontend dev servers.

## Dev Commands
Backend:
```
cd backend
npm install
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` to your backend base URL when needed.
