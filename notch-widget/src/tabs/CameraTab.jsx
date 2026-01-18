import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X } from '../Icons';

export default function CameraTab() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      const hasPermission = await window.notchAPI?.checkCameraPermission();
      if (!hasPermission) {
        alert('Camera permission denied');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    
    // Copy to clipboard
    window.notchAPI?.writeClipboard(dataUrl);
    
    // Flash effect
    const video = videoRef.current;
    video.style.filter = 'brightness(2)';
    setTimeout(() => {
      video.style.filter = 'brightness(1)';
    }, 100);
  };

  return (
    <div className="camera-container">
      <motion.div 
        className="camera-preview"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          style={{ transition: 'filter 0.1s ease' }}
        />
        {!isActive && (
          <motion.div 
            className="camera-overlay"
            onClick={startCamera}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <span>📷 Click to enable camera</span>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        className="camera-controls"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button 
          onClick={capturePhoto}
          disabled={!isActive}
          whileTap={{ scale: 0.9 }}
          style={{ opacity: isActive ? 1 : 0.5 }}
        >
          <Camera size={20} />
        </motion.button>
        <motion.button 
          onClick={stopCamera}
          disabled={!isActive}
          whileTap={{ scale: 0.9 }}
          style={{ opacity: isActive ? 1 : 0.5 }}
        >
          <X size={20} />
        </motion.button>
      </motion.div>
    </div>
  );
}
