# Face Recognition Attendance System

A full-stack, real-time attendance dashboard powered by face recognition. The system uses a webcam to automatically detect known students, mark their attendance in MongoDB, and stream live updates to a React dashboard — all without any manual input.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture & Workflow](#architecture--workflow)
3. [Project File Structure](#project-file-structure)
4. [Dependencies & Libraries](#dependencies--libraries)
5. [AI Models Used](#ai-models-used)
6. [MongoDB Database Design](#mongodb-database-design)
7. [API Reference](#api-reference)
8. [Socket.IO Events](#socketio-events)
9. [Features](#features)
10. [Environment Variables](#environment-variables)
11. [How to Run the Project](#how-to-run-the-project)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Axios, Socket.IO-client |
| **Backend** | Node.js, Express, Socket.IO, node-cron |
| **Database** | MongoDB, Mongoose |
| **AI / CV Service** | Python 3, OpenCV, dlib, face_recognition |

---

## Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Dashboard                             │
│           (Vite · TailwindCSS · Recharts · Socket.IO-client)        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  REST API (Axios)  +  Socket.IO events
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Node.js / Express Backend                         │
│          (Socket.IO server · node-cron · Mongoose ODM)              │
└──────────────────┬──────────────────────────┬───────────────────────┘
                   │  Mongoose                │  HTTP POST + Socket.IO
                   ▼                          ▼
          ┌────────────────┐    ┌─────────────────────────────────────┐
          │   MongoDB      │    │     Python Face-Recognition Service  │
          │  (local/Atlas) │    │  (OpenCV · dlib · face_recognition)  │
          └────────────────┘    └────────────────────┬────────────────┘
                                                     │  USB / built-in
                                                     ▼
                                              [ Webcam / Camera ]
```

### Step-by-step Workflow

1. **Startup** — Python service loads all student photos from `Training images/`, encodes each face into a 128-dimensional vector using dlib's ResNet model and caches them in memory.
2. **Frame capture** — OpenCV reads a frame from the webcam and resizes it to 25 % for fast processing.
3. **Face detection** — dlib's HOG detector (or optional CNN detector) locates face bounding boxes in the frame.
4. **Encoding** — dlib's ResNet model converts each detected face region into a 128-d embedding vector.
5. **Matching** — The embedding is compared against every cached student encoding using Euclidean distance. A match is declared when distance ≤ 0.6.
6. **Attendance mark** — On a match, the service sends `POST /api/attendance/mark` with the student's name. The backend enforces a once-per-day rule via a compound unique index `{name, date}`.
7. **Live stream** — Every frame (annotated with name or "Unknown") is JPEG-encoded, base64-encoded, and emitted over Socket.IO as a `frame` event.
8. **Dashboard update** — The React dashboard receives the `webcam_frame` event and swaps the image `src` in real time. On `attendance_marked`, it refreshes the attendance list without a page reload.
9. **Daily reset** — At 23:59 every night, a `node-cron` job inserts `absent` records for all students who were not detected that day.

---

## Project File Structure

```
Face_Attendance_System/
│
├── Attendance-system-using-Face-Recognition/   ← Original standalone script (kept for Training images)
│   ├── Training images/                        ← Student face photos  →  StudentName.jpg
│   └── main.py                                 ← Original OpenCV script (reference only)
│
├── backend/                                    ← Node.js REST API + Socket.IO server
│   ├── controllers/
│   │   ├── attendanceController.js             ← mark / today / history / CSV export logic
│   │   └── userController.js                  ← CRUD for registered students
│   ├── models/
│   │   ├── Attendance.js                       ← Mongoose schema (name, status, date, time)
│   │   └── User.js                             ← Mongoose schema (name, email, studentId)
│   ├── routes/
│   │   ├── attendanceRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── dailyResetService.js                ← node-cron job that inserts absent records at 23:59
│   ├── sockets/
│   │   └── socketHandler.js                    ← Relays webcam frames + face events to dashboard
│   ├── server.js                               ← Express entry point, MongoDB connection
│   ├── .env                                    ← PORT, MONGODB_URI, FRONTEND_URL
│   └── package.json
│
├── frontend/                                   ← React 18 + Vite + TailwindCSS dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamFeed.jsx                  ← Live video stream + face detection overlay
│   │   │   ├── AttendanceTable.jsx             ← Today's present / absent table
│   │   │   ├── StatsCard.jsx                   ← Summary count cards
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx                   ← Main page with live feed + today's stats
│   │   │   ├── AttendanceHistory.jsx           ← Filterable history + CSV download
│   │   │   └── Users.jsx                       ← Add / remove registered students
│   │   ├── services/
│   │   │   ├── api.js                          ← Axios instance + all REST wrappers
│   │   │   └── socket.js                       ← Socket.IO client singleton
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                                    ← VITE_SOCKET_URL
│   ├── vite.config.js                          ← Proxy /api → localhost:5000
│   └── package.json
│
├── python-service/                             ← Face-recognition microservice
│   ├── face_recognition_service.py             ← Main script (OpenCV + dlib + Socket.IO client)
│   └── requirements.txt                        ← Python dependencies with Windows install notes
│
├── .gitignore                                  ← Ignores node_modules, .env, venv, dist, etc.
└── README.md
```

---

## Dependencies & Libraries

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `express` | HTTP server and REST routing |
| `mongoose` | MongoDB ODM — schema definition and queries |
| `socket.io` | WebSocket server for real-time events |
| `cors` | Cross-origin request handling |
| `dotenv` | Loads `.env` into `process.env` |
| `node-cron` | Cron job scheduler (daily absent reset at 23:59) |
| `json2csv` | Converts attendance records to CSV for export |
| `nodemon` *(dev)* | Auto-restarts server on file changes |

### Frontend (`frontend/package.json`)

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI library |
| `vite` | Next-gen build tool and dev server |
| `tailwindcss` | Utility-first CSS framework |
| `axios` | HTTP client for REST API calls |
| `socket.io-client` | WebSocket client for real-time updates |
| `recharts` | Composable charting (weekly attendance bar chart) |
| `react-router-dom` | Client-side routing (Dashboard / History / Users) |
| `react-hot-toast` | Toast notifications for unknown face alerts |

### Python Service (`python-service/requirements.txt`)

| Package | Purpose |
|---------|---------|
| `opencv-python` | Webcam capture, frame resize, JPEG encoding |
| `dlib-bin` | Pre-built dlib wheels (no CMake required) |
| `face-recognition` | High-level API over dlib's face encoding models |
| `face-recognition-models` | Bundled `.dat` model files used by face-recognition |
| `numpy` | Array operations on face encodings |
| `python-socketio[client]` | Emits frames and face events to the Node.js backend |
| `requests` | Sends `POST /api/attendance/mark` HTTP calls |
| `Pillow` | Image pre-processing helpers |

---

## AI Models Used

The `face_recognition` library bundles four pre-trained dlib models (installed automatically via `face-recognition-models`). No separate download is needed.

| Model File | Type | Purpose |
|------------|------|---------|
| `shape_predictor_68_face_landmarks.dat` | Landmark detector | Detects 68 facial key-points (eyes, nose, jaw, mouth) used to align faces before encoding |
| `shape_predictor_5_face_landmarks.dat` | Lightweight landmark detector | Faster 5-point variant used for face alignment in the encoding pipeline |
| `dlib_face_recognition_resnet_model_v1.dat` | Deep ResNet (29-layer) | Converts an aligned face crop into a **128-dimensional embedding** vector. Trained on ~3 million faces. Accuracy ≈ 99.38 % on LFW benchmark |
| `mmod_human_face_detector.dat` | CNN face detector (MMOD) | High-accuracy deep-learning detector; optional alternative to HOG. More accurate on small/angled faces but slower |

### How Recognition Works Under the Hood

```
Raw frame
   │
   ▼  HOG detector  (or CNN MMOD detector)
Face bounding boxes
   │
   ▼  shape_predictor_5  →  align face crop
Aligned 150×150 face image
   │
   ▼  ResNet dlib_face_recognition_resnet_model_v1.dat
128-dimensional float vector  (embedding)
   │
   ▼  numpy.linalg.norm  (Euclidean distance vs. all known encodings)
distance ≤ 0.6  →  MATCH (student name)
distance  > 0.6  →  UNKNOWN
```

---

## MongoDB Database Design

### `users` collection

```js
{
  name:      String,   // "John Doe"
  email:     String,   // unique
  studentId: String,   // unique
  createdAt: Date
}
```

### `attendances` collection

```js
{
  name:      String,              // must match a user name
  status:    String,              // "present" | "absent"
  date:      String,              // "YYYY-MM-DD"
  time:      String,              // "HH:MM:SS"  (time of detection)
  createdAt: Date
}
// Compound unique index:  { name: 1, date: 1 }
// → guarantees at most one record per student per day
```

---

## API Reference

### Attendance Endpoints

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| `POST` | `/api/attendance/mark` | `{ name }` | Mark student present (once per day) |
| `GET` | `/api/attendance/today` | — | All today's records + present / absent counts |
| `GET` | `/api/attendance/history` | `?date=YYYY-MM-DD&name=X` | Filterable history |
| `GET` | `/api/attendance/export` | `?date=YYYY-MM-DD` | Download attendance as `.csv` |

### User Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users` | — | All registered students |
| `POST` | `/api/users/add` | `{ name, email, studentId }` | Register a new student |
| `GET` | `/api/users/:id` | — | Get single student by MongoDB `_id` |
| `DELETE` | `/api/users/:id` | — | Remove a student |

---

## Socket.IO Events

| Direction | Event name | Payload | Description |
|-----------|-----------|---------|-------------|
| Python → Backend → Dashboard | `frame` / `webcam_frame` | `{ image: "<base64 JPEG>", timestamp }` | Live annotated webcam frame |
| Python → Backend → Dashboard | `face_detected` | `{ name, timestamp }` | Known face recognised |
| Python → Backend → Dashboard | `unknown_face` / `unknown_face_alert` | `{ message, timestamp }` | Unrecognised face detected |
| Backend → Dashboard | `attendance_marked` | Attendance document | Fires after a successful DB insert |
| Backend → Dashboard | `daily_reset` | `{ date, absentCount }` | Fires after the 23:59 cron job completes |

---

## Features

| Feature | Detail |
|---------|--------|
| Live webcam stream | Base64 JPEG frames pushed via Socket.IO at ~20 FPS |
| Real-time face recognition | Throttled to one recognition check per second to keep CPU usage low |
| Auto attendance marking | Once-per-day rule enforced by a compound unique DB index — no duplicates |
| Unknown face alerts | Red bounding box in the video feed + toast notification in the dashboard |
| Daily absent cron | At 23:59, all students with no `present` record for the day get an `absent` entry |
| CSV export | Download filtered attendance data directly from the history page |
| Weekly analytics chart | Bar chart (Recharts) showing present count per day for the last 7 days |
| User management | Add and remove registered students from the dashboard without touching the DB directly |

---

## Environment Variables

### `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/face_attendance
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_SOCKET_URL=http://localhost:5000
```

---

## How to Run the Project

### Prerequisites

| Tool | Required version | Notes |
|------|-----------------|-------|
| Node.js | 18 + | [nodejs.org](https://nodejs.org) |
| npm | 9 + | bundled with Node.js |
| MongoDB | 6 + | [mongodb.com/try/download](https://www.mongodb.com/try/download/community) |
| Python | 3.8 – 3.12 | [python.org](https://www.python.org/downloads/) |

> **Windows note:** `dlib-bin` installs a pre-compiled wheel so **no CMake or C++ build tools are required**.

---

### Step 1 — Start MongoDB

```bash
mongod
```

Leave this terminal open. MongoDB listens on `localhost:27017` by default.

---

### Step 2 — Start the Backend

```bash
cd backend
npm install
npm run dev
```

Server starts at **http://localhost:5000**. You should see:

```
MongoDB connected
Server running on port 5000
```

---

### Step 3 — Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Dashboard is available at **http://localhost:5173**.

---

### Step 4 — Install Python Dependencies

Open a new terminal and create / activate a virtual environment:

```bash
# Create venv  (do this once)
python -m venv .venv

# Activate on Windows
.venv\Scripts\activate
```

Then install packages in the correct order (important on Windows):

```bash
# 1. Install dlib pre-built wheel first (no CMake needed)
pip install dlib-bin

# 2. Install face-recognition WITHOUT letting it re-download dlib from source
pip install face-recognition --no-deps

# 3. Install the remaining dependencies normally
pip install face-recognition-models opencv-python numpy python-socketio[client] requests Pillow
```

---

### Step 5 — Run the Python Face-Recognition Service

```bash
cd python-service

# Run using the venv Python executable (Windows — adjust path if your venv is elsewhere)
C:\Users\hp\Downloads\Face_Attendance_System\.venv\Scripts\python.exe face_recognition_service.py

# Or, if the venv is already activated in the current shell:
python face_recognition_service.py
```

The service will:
- Load and encode every photo found in `Attendance-system-using-Face-Recognition/Training images/`
- Open the webcam
- Start recognising faces and marking attendance

---

### Adding a New Student

1. Add a clear, front-facing photo to `Attendance-system-using-Face-Recognition/Training images/`.
   - File name = student name, e.g. `JohnDoe.jpg`
2. Go to the dashboard → **Users** page → **Add Student** and fill in name, email, and ID.
3. Restart `face_recognition_service.py` so it re-indexes the new photo.

---

### All Commands at a Glance

```bash
# Terminal 1 — Database
mongod

# Terminal 2 — Backend
cd backend && npm install && npm run dev

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev

# Terminal 4 — Python service  (venv must be activated)
cd python-service
pip install dlib-bin
pip install face-recognition --no-deps
pip install face-recognition-models opencv-python numpy python-socketio[client] requests Pillow
python face_recognition_service.py
```
