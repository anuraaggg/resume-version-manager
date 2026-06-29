# Backend - Resume Version Manager

Express + MongoDB API for authentication and resume versioning.

## Env
Create `.env` with these keys:

```
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=your_jwt_secret
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
- GET /api/resumes
- POST /api/resumes/upload (multipart `file`)
- GET /api/resumes/:id
- DELETE /api/resumes/:id
