import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, Clock, Video, Copy, FolderOpen, Settings } from './Icons';
import HomeTab from './tabs/HomeTab';
import NotesTab from './tabs/NotesTab';
import TimerTab from './tabs/TimerTab';
import CameraTab from './tabs/CameraTab';
import SnippetsTab from './tabs/SnippetsTab';
import SettingsTab from './tabs/SettingsTab';

const TABS = [
  { id: 'home', icon: Home, position: 'left' },
  { id: 'notes', icon: FileText, position: 'left' },
  { id: 'timer', icon: Clock, position: 'left' },
  { id: 'camera', icon: Video, position: 'right' },
  { id: 'snippets', icon: Copy, position: 'right' },
  { id: 'settings', icon: Settings, position: 'right' },
];

// Default timing constants
const DEFAULT_COLLAPSE_DELAY = 2000;
const DEFAULT_HIDE_DELAY = 2500;

// Load saved theme on app start
const loadSavedTheme = async () => {
  try {
    const settings = await window.notchAPI?.getSettings();
    if (settings?.theme) {
      document.body.classList.remove('theme-liquid-glass', 'theme-tron-legacy', 'theme-tron-ares');
      document.body.classList.add(`theme-${settings.theme}`);
    }
    // Apply blur and accent after theme to override theme defaults
    if (settings?.blurAmount) {
      document.body.style.setProperty('--blur', `${settings.blurAmount}px`, 'important');
    }
    if (settings?.accentColor) {
      document.body.style.setProperty('--accent', settings.accentColor, 'important');
    }
    return settings;
  } catch (e) {
    console.error('Failed to load theme:', e);
    return null;
  }
};

export default function App() {
  // Core states
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [hideDelay, setHideDelay] = useState(DEFAULT_HIDE_DELAY);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [navTooltipText, setNavTooltipText] = useState('');
  const [navTooltipVisible, setNavTooltipVisible] = useState(false);
  const [navTooltipIndex, setNavTooltipIndex] = useState(-1);
  
  // Refs for tracking
  const isMouseOverWidget = useRef(false);
  const collapseTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const hideDelayRef = useRef(DEFAULT_HIDE_DELAY); // Ref for use in timers
  
  // Keep ref in sync with state
  useEffect(() => {
    hideDelayRef.current = hideDelay;
  }, [hideDelay]);
  
  // Clear all timers helper
  const clearAllTimers = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Expand the widget
  const expandWidget = () => {
    clearAllTimers();
    setIsExpanded(true);
    window.notchAPI?.expand();
  };

  // Collapse to pill
  const collapseWidget = () => {
    setIsExpanded(false);
    window.notchAPI?.collapse();
    
    // Start hide timer after collapsing
    hideTimerRef.current = setTimeout(() => {
      if (!isMouseOverWidget.current) {
        setIsVisible(false);
      }
    }, hideDelayRef.current);
  };

  // Hide completely
  const hideWidget = () => {
    setIsVisible(false);
    setIsExpanded(false);
    window.notchAPI?.collapse();
  };

  // Show the widget (when cursor enters notch area)
  const showWidget = async () => {
    clearAllTimers();
    // Reset window position to center with smooth animation
    await window.notchAPI?.resetPosition();
    // Small delay to let position animation complete
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  };

  // Listen for mouse near notch from main process
  useEffect(() => {
    // Load saved settings on mount
    const initSettings = async () => {
      const settings = await loadSavedTheme();
      if (settings?.hideDelay) {
        setHideDelay(settings.hideDelay);
      }
    };
    initSettings();
    
    const handleMouseNear = (isNear) => {
      if (isNear) {
        // Cursor entered notch area - show the widget
        showWidget();
      }
      // Note: We don't hide here - we let the widget's own mouse events handle that
    };

    if (window.notchAPI?.onMouseNearNotch) {
      window.notchAPI.onMouseNearNotch(handleMouseNear);
    }
    
    // Listen for settings changes from SettingsTab
    const handleSettingsChange = (e) => {
      if (e.detail?.hideDelay) {
        setHideDelay(e.detail.hideDelay);
      }
    };
    window.addEventListener('settings-changed', handleSettingsChange);
    
    // Cleanup
    return () => {
      clearAllTimers();
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);

  // Mouse enters the widget container
  const handleMouseEnter = () => {
    isMouseOverWidget.current = true;
    clearAllTimers();
    // Keep widget visible
    setIsVisible(true);
  };

  // Mouse leaves the widget container
  const handleMouseLeave = () => {
    isMouseOverWidget.current = false;
    setHoveredIndex(-1);
    
    // Start collapse timer
    if (isExpanded) {
      collapseTimerRef.current = setTimeout(() => {
        if (!isMouseOverWidget.current) {
          collapseWidget();
        }
      }, DEFAULT_COLLAPSE_DELAY);
    } else {
      // If already collapsed (pill), start hide timer
      hideTimerRef.current = setTimeout(() => {
        if (!isMouseOverWidget.current) {
          hideWidget();
        }
      }, hideDelayRef.current);
    }
  };

  // Handle tab/button click
  const handleTabClick = (tabId) => {
    clearAllTimers();
    setActiveTab(tabId);
    
    if (!isExpanded) {
      expandWidget();
    }
  };

  const leftTabs = TABS.filter(t => t.position === 'left');
  const rightTabs = TABS.filter(t => t.position === 'right');

  return (
    <>
    <AnimatePresence>
      {isVisible && (
    <motion.div
      className={`notch-container ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ y: -50, opacity: 0, scale: 0.95, borderRadius: 18 }}
      animate={{
        height: isExpanded ? 300 : 36,
        y: 0,
        opacity: 1,
        scale: 1,
        borderRadius: isExpanded ? 18 : 18,
      }}
      exit={{ y: -50, opacity: 0, scale: 0.96, borderRadius: 18 }}
      transition={{
        height: { 
          type: 'spring', 
          stiffness: 280, 
          damping: 30, 
          mass: 0.8,
          restDelta: 0.01,
          restSpeed: 0.01
        },
        y: { 
          type: 'spring', 
          stiffness: 240, 
          damping: 24,
          mass: 0.6,
          restDelta: 0.01
        },
        scale: {
          type: 'spring',
          stiffness: 280,
          damping: 28,
          mass: 0.6
        },
        borderRadius: {
          type: 'spring',
          stiffness: 260,
          damping: 26
        },
        opacity: { 
          duration: 0.22, 
          ease: [0.32, 0.72, 0, 1]
        },
      }}
    >
      {/* Dynamic Island style glass pill */}
      <div className="notch-glass" />

      {/* Collapsed pill with all icons */}
      <div className="collapsed-pill">
        <div className="pill-icons-left">
          {leftTabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              className={`pill-icon ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => {
                setHoveredIndex(index);
                setTooltipText(tab.id.charAt(0).toUpperCase() + tab.id.slice(1));
                setTooltipVisible(true);
              }}
              onMouseLeave={() => {
                setHoveredIndex(-1);
                setTooltipVisible(false);
              }}
              animate={{
                scale: hoveredIndex === index ? 1.8 : 1,
                y: hoveredIndex === index ? -2 : 0,
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 20,
                mass: 0.5,
                restDelta: 0.001
              }}
            >
              <tab.icon size={14} />
            </motion.div>
          ))}
        </div>
        <div className="pill-icons-right">
          {rightTabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              className={`pill-icon ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => {
                setHoveredIndex(leftTabs.length + index);
                setTooltipText(tab.id.charAt(0).toUpperCase() + tab.id.slice(1));
                setTooltipVisible(true);
              }}
              onMouseLeave={() => {
                setHoveredIndex(-1);
                setTooltipVisible(false);
              }}
              animate={{
                scale: hoveredIndex === leftTabs.length + index ? 1.8 : 1,
                y: hoveredIndex === leftTabs.length + index ? -2 : 0,
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 20,
                mass: 0.5,
                restDelta: 0.001
              }}
            >
              <tab.icon size={14} />
            </motion.div>
          ))}
        </div>
        
        {/* Tooltip */}
        <AnimatePresence>
          {tooltipVisible && (
            <motion.div
              className="pill-tooltip"
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              transition={{ 
                duration: 0.18, 
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {tooltipText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Bar (expanded) */}
      <div className="nav-bar">
        {/* Left tabs */}
        <div className="nav-group nav-left">
          {leftTabs.map((tab, index) => (
            <div key={tab.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.button
                data-tab={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => {
                  setNavTooltipText(tab.id.charAt(0).toUpperCase() + tab.id.slice(1));
                  setNavTooltipVisible(true);
                  setNavTooltipIndex(index);
                }}
                onMouseLeave={() => {
                  setNavTooltipVisible(false);
                  setNavTooltipIndex(-1);
                }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <tab.icon size={16} />
              </motion.button>
              <AnimatePresence>
                {navTooltipVisible && navTooltipIndex === index && (
                  <motion.div
                    className="nav-btn-tooltip"
                    initial={{ opacity: 0, y: -5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    transition={{ 
                      duration: 0.18, 
                      ease: [0.16, 1, 0.3, 1]
                    }}
                  >
                    {navTooltipText}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Right tabs */}
        <div className="nav-group nav-right">
          {rightTabs.map((tab, index) => (
            <div key={tab.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.button
                data-tab={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => {
                  setNavTooltipText(tab.id.charAt(0).toUpperCase() + tab.id.slice(1));
                  setNavTooltipVisible(true);
                  setNavTooltipIndex(leftTabs.length + index);
                }}
                onMouseLeave={() => {
                  setNavTooltipVisible(false);
                  setNavTooltipIndex(-1);
                }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <tab.icon size={16} />
              </motion.button>
              <AnimatePresence>
                {navTooltipVisible && navTooltipIndex === leftTabs.length + index && (
                  <motion.div
                    className="nav-btn-tooltip"
                    initial={{ opacity: 0, y: -5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    transition={{ 
                      duration: 0.18, 
                      ease: [0.16, 1, 0.3, 1]
                    }}
                  >
                    {navTooltipText}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            className="content-area"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <HomeTab />}
            {activeTab === 'notes' && <NotesTab />}
            {activeTab === 'timer' && <TimerTab />}
            {activeTab === 'camera' && <CameraTab />}
            {activeTab === 'snippets' && <SnippetsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
      )}
    </AnimatePresence>
    
    {/* SVG Filter for Liquid Glass Effect */}
    <svg className="glass-filter-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glass-distortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feGaussianBlur
            in="turbulence"
            stdDeviation="3"
            result="softMap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="150"
          />
        </filter>
      </defs>
    </svg>
    </>
  );
}
