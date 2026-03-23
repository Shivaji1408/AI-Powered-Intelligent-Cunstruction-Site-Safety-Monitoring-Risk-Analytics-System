/**
 * Socket.io event handler
 * Manages connections from both the React dashboard (browser clients)
 * and the Python face-recognition service.
 */
const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /**
     * Python service emits 'frame' events containing base64-encoded JPEG frames.
     * The server broadcasts them to all connected browser clients as 'webcam_frame'.
     */
    socket.on('frame', (data) => {
      // Relay webcam frame to all dashboard clients
      socket.broadcast.emit('webcam_frame', data);
    });

    /**
     * Python service emits 'face_detected' when a known face is recognised.
     * Broadcast the event to update the dashboard in real-time.
     */
    socket.on('face_detected', (data) => {
      io.emit('face_detected', data);
    });

    /**
     * Python service emits 'unknown_face' when an unrecognised face appears.
     * Forward an alert event to all dashboard clients.
     */
    socket.on('unknown_face', (data) => {
      io.emit('unknown_face_alert', {
        message: 'Unknown face detected! Access denied.',
        timestamp: new Date().toISOString(),
        ...data
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error on ${socket.id}:`, err.message);
    });
  });
};

module.exports = { initSocketHandler };
