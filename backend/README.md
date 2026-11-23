# Backend - Resume Version Manager

Express + MongoDB API for authentication and resume versioning.

## Env
Create `.env` with these keys:

```
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=use-a-random-secret-at-least-32-characters-long
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

You can list multiple allowed frontend origins by separating them with commas, for example:

```
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.com
```

## Scripts
- dev: nodemon server
- start: node server

## Routes
- POST /api/auth/register
- POST /api/auth/login
- GET /api/resumes?page=1&limit=10
- POST /api/resumes/upload (multipart `resume`)
- GET /api/resumes/:id/url
- DELETE /api/resumes/:id

The resume list is paginated by title group. `page` defaults to 1 and `limit`
defaults to 10 (maximum 50); the response includes `resumes` and pagination
metadata (`page`, `limit`, `totalGroups`, and `totalPages`).

Resume deletion hides the record immediately and retries Cloudinary cleanup in
the background with capped exponential backoff if the storage request fails.

Passwords must be between 8 and 128 characters. `JWT_SECRET` must be at least
32 characters and should be generated randomly.
