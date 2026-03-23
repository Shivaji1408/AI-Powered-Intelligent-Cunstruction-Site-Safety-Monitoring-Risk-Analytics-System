"""
face_recognition_service.py
────────────────────────────
Python service that:
  1. Loads known faces from the Training images folder.
  2. Captures webcam frames using OpenCV.
  3. Recognises faces using the face_recognition library.
  4. Streams annotated frames to the Node backend via Socket.IO.
  5. POSTs a REST call to mark attendance when a known face is detected.

Start this AFTER the Node backend is running:
    python face_recognition_service.py
"""

import cv2
import numpy as np
import os
import requests
import base64
import time
import threading
from datetime import datetime

# face_recognition requires dlib — skip gracefully if not yet installed
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    print("[Warning] face_recognition not installed — recognition disabled.")
    print("[Warning] Install it with: pip install face-recognition")
    FACE_RECOGNITION_AVAILABLE = False

import socketio   # pip install "python-socketio[client]"

# ─── Configuration ────────────────────────────────────────────────────────────

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")

# Path to the Training images folder in the original project
TRAINING_IMAGES_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Attendance-system-using-Face-Recognition",
    "Training images"
)

# How often to push a frame over the socket (~20 FPS)
FRAME_EMIT_INTERVAL = 0.05

# How often to run face recognition (seconds) — throttled to save CPU
RECOGNITION_INTERVAL = 1.0

# Minimum face-distance threshold: below this value = recognised
RECOGNITION_THRESHOLD = 0.6

# ─── Socket.IO Client ─────────────────────────────────────────────────────────

sio = socketio.Client(reconnection=True, reconnection_attempts=10, logger=False)


@sio.event
def connect():
    print("[Socket] Connected to Node backend ✓")


@sio.event
def disconnect():
    print("[Socket] Disconnected from Node backend")


@sio.event
def connect_error(data):
    print(f"[Socket] Connection error: {data}")


# ─── Training Data Loader ─────────────────────────────────────────────────────

def load_known_faces(path: str):
    """
    Load every image file from `path`, compute its 128-d face encoding,
    and return (encodings_list, names_list).
    Files without a detectable face are skipped gracefully.
    """
    encodings = []
    names = []

    if not FACE_RECOGNITION_AVAILABLE:
        print("[Info] Skipping face loading — face_recognition not installed.")
        return encodings, names

    if not os.path.isdir(path):
        print(f"[Warning] Training folder not found: {path}")
        return encodings, names

    for filename in os.listdir(path):
        img_path = os.path.join(path, filename)
        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            continue

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        enc_list = face_recognition.face_encodings(img_rgb)

        if enc_list:
            encodings.append(enc_list[0])
            names.append(os.path.splitext(filename)[0])
        else:
            print(f"[Warning] No face found in training image: {filename}")

    print(f"[Info] Encoded {len(encodings)} known face(s): {names}")
    return encodings, names


# ─── Attendance REST call ──────────────────────────────────────────────────────

def mark_attendance_api(name: str):
    """Send a POST request to the Node backend to mark attendance."""
    try:
        resp = requests.post(
            f"{NODE_BACKEND_URL}/api/attendance/mark",
            json={"name": name},
            timeout=5
        )
        data = resp.json()
        print(f"[Attendance] {name} → {resp.status_code}: {data.get('message', '')}")
    except requests.exceptions.RequestException as exc:
        print(f"[Error] Attendance API call failed: {exc}")


# ─── Main Service ─────────────────────────────────────────────────────────────

def run_service():
    # ── Connect Socket.IO ──────────────────────────────────────────────────────
    try:
        sio.connect(NODE_BACKEND_URL)
    except Exception as exc:
        print(f"[Warning] Could not connect via Socket.IO: {exc}")
        print("[Info] Frame streaming will be skipped; REST attendance marking will still work.")

    # ── Load training data ─────────────────────────────────────────────────────
    known_encodings, known_names = load_known_faces(TRAINING_IMAGES_PATH)

    # ── Open webcam ───────────────────────────────────────────────────────────
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Error] Could not open webcam. Exiting.")
        return

    last_emit_time = 0.0
    last_recognition_time = 0.0

    # Track recently seen names — prevents calling the API more than once per session
    # (DB unique index handles actual duplicates; this just reduces noise)
    # Start EMPTY every session so the first detection always calls the API,
    # which makes the backend emit the socket event even if already marked today.
    seen_today: set = set()
    seen_date = datetime.now().strftime("%Y-%m-%d")

    # Persistent annotations — redrawn on EVERY frame so boxes don't flash
    # Each entry: (top, right, bottom, left, label, color)
    current_annotations: list = []

    print("[Info] Face-recognition service started. Press 'q' in the OpenCV window to quit.")

    while True:
        success, frame = cap.read()
        if not success:
            print("[Error] Failed to read frame from webcam.")
            break

        now = time.time()
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Reset seen cache on a new day
        if today_str != seen_date:
            seen_today.clear()
            seen_date = today_str

        # ── Face Recognition (throttled) ──────────────────────────────────────
        if (now - last_recognition_time >= RECOGNITION_INTERVAL
                and known_encodings
                and FACE_RECOGNITION_AVAILABLE):
            # Scale down for faster processing
            small = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

            face_locations = face_recognition.face_locations(rgb_small)
            face_encodings_frame = face_recognition.face_encodings(rgb_small, face_locations)

            new_annotations = []
            for face_enc, face_loc in zip(face_encodings_frame, face_locations):
                distances = face_recognition.face_distance(known_encodings, face_enc)
                best_idx = int(np.argmin(distances))

                # Scale bounding box back to full resolution
                top, right, bottom, left = (v * 4 for v in face_loc)

                if distances[best_idx] < RECOGNITION_THRESHOLD:
                    name = known_names[best_idx].upper()
                    new_annotations.append((top, right, bottom, left, name, (0, 255, 0)))

                    # Emit socket event so dashboard highlights the name
                    if sio.connected:
                        try:
                            sio.emit('face_detected', {
                                'name': name,
                                'timestamp': datetime.now().isoformat()
                            })
                        except Exception:
                            pass

                    # Mark attendance via REST (once per person per day)
                    if name not in seen_today:
                        seen_today.add(name)
                        threading.Thread(
                            target=mark_attendance_api, args=(name,), daemon=True
                        ).start()

                else:
                    new_annotations.append((top, right, bottom, left, "Unknown", (0, 0, 255)))

                    if sio.connected:
                        try:
                            sio.emit('unknown_face', {'timestamp': datetime.now().isoformat()})
                        except Exception:
                            pass

            # Update persistent annotations for all subsequent frames
            current_annotations = new_annotations
            last_recognition_time = now

        # ── Draw persistent annotations on every frame ────────────────────────
        for (top, right, bottom, left, label, color) in current_annotations:
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            cv2.putText(
                frame, label, (left + 6, bottom - 6),
                cv2.FONT_HERSHEY_COMPLEX, 0.8, (255, 255, 255), 2
            )

        # ── Stream frame to dashboard via Socket.IO ───────────────────────────
        if now - last_emit_time >= FRAME_EMIT_INTERVAL and sio.connected:
            _, buffer = cv2.imencode(
                '.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70]
            )
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            try:
                sio.emit('frame', {
                    'image': frame_b64,
                    'timestamp': datetime.now().isoformat()
                })
            except Exception:
                pass
            last_emit_time = now

        # ── Local preview window ──────────────────────────────────────────────
        cv2.imshow('Face Recognition Attendance (press Q to quit)', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("[Info] Quit signal received.")
            break

    cap.release()
    cv2.destroyAllWindows()

    if sio.connected:
        sio.disconnect()

    print("[Info] Face-recognition service stopped.")


if __name__ == '__main__':
    run_service()
