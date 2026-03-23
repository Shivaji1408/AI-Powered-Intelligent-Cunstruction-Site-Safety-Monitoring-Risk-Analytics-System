import React, { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';

const WebcamFeed = () => {
  const imgRef = useRef(null);
  const alertTimerRef = useRef(null);
  const isStreamingRef = useRef(false);  // track without triggering re-render

  const [isStreaming, setIsStreaming] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);   // { name, time }
  const [unknownAlert, setUnknownAlert] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);

  useEffect(() => {
    // ── Socket connection status ──────────────────────────────────────────────
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => {
      setIsSocketConnected(false);
      setIsStreaming(false);
      isStreamingRef.current = false;
    };

    // ── Incoming webcam frame ─────────────────────────────────────────────────
    const handleFrame = (data) => {
      if (imgRef.current && data?.image) {
        imgRef.current.src = `data:image/jpeg;base64,${data.image}`;
        if (!isStreamingRef.current) {
          isStreamingRef.current = true;
          setIsStreaming(true);
        }
      }
    };

    // ── Face detected event ───────────────────────────────────────────────────
    const handleFaceDetected = (data) => {
      setLastDetected({
        name: data.name,
        time: new Date().toLocaleTimeString()
      });
    };

    // ── Unknown face alert ────────────────────────────────────────────────────
    const handleUnknownFace = () => {
      setUnknownAlert(true);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setUnknownAlert(false), 4000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('webcam_frame', handleFrame);
    socket.on('face_detected', handleFaceDetected);
    socket.on('unknown_face_alert', handleUnknownFace);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('webcam_frame', handleFrame);
      socket.off('face_detected', handleFaceDetected);
      socket.off('unknown_face_alert', handleUnknownFace);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []); // run once — img src is mutated via ref, no state needed in deps

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-white text-sm">Live Camera Feed</h2>

        <div className="flex items-center gap-2">
          {/* Unknown-face alert badge */}
          {unknownAlert && (
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full animate-pulse">
              ⚠ Unknown Face
            </span>
          )}

          {/* Connection indicator */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isStreaming
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : isSocketConnected
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                : 'bg-gray-800 text-gray-500 border-gray-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStreaming
                  ? 'bg-green-400 animate-pulse'
                  : isSocketConnected
                  ? 'bg-yellow-400'
                  : 'bg-gray-600'
              }`}
            />
            {isStreaming ? 'Live' : isSocketConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        {/* Placeholder shown when no stream is active */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-3">
            <span className="text-5xl">📷</span>
            <div className="text-center">
              <p className="text-sm text-gray-500">Waiting for Python service…</p>
              <p className="text-xs text-gray-700 mt-1">
                Run: <code className="bg-gray-800 px-1.5 py-0.5 rounded">python face_recognition_service.py</code>
              </p>
            </div>
          </div>
        )}

        {/* Live stream img tag — src is swapped by the socket handler */}
        <img
          ref={imgRef}
          alt="Live webcam feed"
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />
      </div>

      {/* Last-detected footer */}
      {lastDetected && (
        <div className="px-5 py-2.5 border-t border-gray-800 flex items-center gap-2 bg-green-500/5">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <span className="text-sm text-green-300">
            Detected: <strong>{lastDetected.name}</strong>
          </span>
          <span className="text-xs text-gray-500 ml-auto">{lastDetected.time}</span>
        </div>
      )}
    </div>
  );
};

export default WebcamFeed;
