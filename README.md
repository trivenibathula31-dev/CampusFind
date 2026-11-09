# CampusFind — MERN Stack Project

## Stack
MongoDB, Express.js, React (Vite), Node.js.

## Setup
1. Install Node.js LTS and MongoDB locally, or create a MongoDB Atlas database.
2. Extract ZIP and open folder in VS Code.
3. Run `npm install` in project root.
4. Run `npm install --prefix client`.
5. Copy `.env.example` to `.env` and set `MONGO_URI`.
6. Run `npm run dev`.
7. Open the Vite URL shown in terminal (typically http://localhost:5173).

Backend API: http://localhost:5000/api/items
Health: http://localhost:5000/api/health

CRUD endpoints:
- GET /api/items (optional ?status=Lost&search=wallet)
- GET /api/items/:id
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id
