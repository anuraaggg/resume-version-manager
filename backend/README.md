# Backend - Resume Version Manager

Express + MongoDB API for authentication and resume versioning.

## Env
Create `.env` with these keys:

```
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
