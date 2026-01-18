import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Plus } from '../Icons';

const PRESETS = [
  { label: '02:00', seconds: 120 },
  { label: '10:00', seconds: 600 },
  { label: '15:00', seconds: 900 },
  { label: '30:00', seconds: 1800 },
  { label: '01:00:00', seconds: 3600 },
];

export default function TimerTab() {
  const [mode, setMode] = useState('countdown');
  const [displayValue, setDisplayValue] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState(600);
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const pollRef = useRef(null);

  // Sync with background timer
  const syncWithBackend = async () => {
    try {
      const state = await window.notchAPI?.timerGetState?.();
      if (state) {
        setMode(state.mode);
        setIsRunning(state.isRunning);
        setDisplayValue(state.currentValue);
        setActivePreset(state.initialDuration);
      }
    } catch (e) {
      console.error('Failed to sync timer state:', e);
    }
  };

  useEffect(() => {
    // Initial sync
    syncWithBackend();
    
    // Poll for updates when component is visible
    pollRef.current = setInterval(syncWithBackend, 100);
    
    // Listen for timer complete
    window.notchAPI?.onTimerComplete?.(() => {
      syncWithBackend();
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isRunning) {
      await window.notchAPI?.timerPause?.();
    } else {
      await window.notchAPI?.timerStart?.(mode, activePreset);
    }
    syncWithBackend();
  };

  const handleReset = async () => {
    await window.notchAPI?.timerReset?.(activePreset);
    syncWithBackend();
  };

  const handlePreset = async (secs) => {
    setActivePreset(secs);
    await window.notchAPI?.timerSetDuration?.(secs);
    syncWithBackend();
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    await window.notchAPI?.timerSetMode?.(newMode);
    syncWithBackend();
  };

  const handleCustomTime = async () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalSecs = mins * 60 + secs;
    if (totalSecs > 0) {
      setActivePreset(totalSecs);
      await window.notchAPI?.timerSetDuration?.(totalSecs);
      setShowCustom(false);
      setCustomMinutes('');
      setCustomSeconds('');
      syncWithBackend();
    }
  };

  const displayTime = mode === 'countdown' 
    ? formatTime(displayValue) 
    : formatStopwatch(displayValue);

  return (
    <div className="timer-container">
      {/* Timer Display */}
      <motion.div 
        className="timer-display"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div 
          className="timer-time"
          key={displayTime}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {displayTime}
        </motion.div>
        <div className="timer-controls">
          <motion.button 
            className="primary"
            onClick={handlePlayPause}
            whileTap={{ scale: 0.9 }}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </motion.button>
          <motion.button onClick={handleReset} whileTap={{ scale: 0.9 }}>
            <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
          </motion.button>
        </div>
      </motion.div>

      {/* Presets */}
      <div className="timer-presets">
        <div className="preset-tabs">
          <motion.button
            className={`preset-tab ${mode === 'countdown' ? 'active' : ''}`}
            onClick={() => handleModeChange('countdown')}
            whileTap={{ scale: 0.95 }}
          >
            ⏱ Timer
          </motion.button>
          <motion.button
            className={`preset-tab ${mode === 'stopwatch' ? 'active' : ''}`}
            onClick={() => handleModeChange('stopwatch')}
            whileTap={{ scale: 0.95 }}
          >
            ⏱ Stopwatch
          </motion.button>
        </div>

        {mode === 'countdown' && (
          <motion.div 
            className="preset-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {PRESETS.map((preset) => (
              <motion.button
                key={preset.seconds}
                className={`preset-btn ${activePreset === preset.seconds && !isRunning ? 'active' : ''}`}
                onClick={() => handlePreset(preset.seconds)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset.label}
              </motion.button>
            ))}
            <motion.button
              className={`preset-btn custom-btn ${showCustom ? 'active' : ''}`}
              onClick={() => setShowCustom(!showCustom)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ⚙️ Custom
            </motion.button>
          </motion.div>
        )}

        {/* Custom time input */}
        <AnimatePresence>
          {showCustom && mode === 'countdown' && (
            <motion.div
              className="custom-time-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="custom-time-fields">
                <input
                  type="number"
                  placeholder="Min"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  min="0"
                  max="999"
                />
                <span>:</span>
                <input
                  type="number"
                  placeholder="Sec"
                  value={customSeconds}
                  onChange={e => setCustomSeconds(e.target.value)}
                  min="0"
                  max="59"
                />
              </div>
              <motion.button 
                className="set-custom-btn"
                onClick={handleCustomTime}
                whileTap={{ scale: 0.95 }}
              >
                Set Timer
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
