import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const THEMES = [
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    icon: '💎',
    description: 'Apple-inspired glassmorphism'
  },
  {
    id: 'tron-legacy',
    name: 'Tron Legacy',
    icon: '🔵',
    description: 'Neon blue cyberpunk'
  },
  {
    id: 'tron-ares',
    name: 'Tron Ares',
    icon: '🔴',
    description: 'Red grid warrior'
  }
];

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    launchAtLogin: false,
    showOnAllDesktops: true,
    theme: 'liquid-glass',
    accentColor: '#0A84FF',
    widgetWidth: 760,
    widgetHeight: 320,
    hideDelay: 2500,
    blurAmount: 40
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await window.notchAPI?.getSettings();
    if (saved) setSettings(prev => ({ ...prev, ...saved }));
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await window.notchAPI?.saveSettings(updated);
    
    // Apply real-time changes via main process
    await window.notchAPI?.applySettings(updated);
    
    // Apply CSS changes
    if (key === 'accentColor') {
      document.body.style.setProperty('--accent', value, 'important');
    }
    if (key === 'blurAmount') {
      document.body.style.setProperty('--blur', `${value}px`, 'important');
    }
    if (key === 'theme') {
      applyTheme(value);
    }
    
    // Broadcast hide delay changes to App.jsx
    if (key === 'hideDelay') {
      window.dispatchEvent(new CustomEvent('settings-changed', { detail: { hideDelay: value } }));
    }
  };

  const applyTheme = (themeId) => {
    // Remove all theme classes
    document.body.classList.remove('theme-liquid-glass', 'theme-tron-legacy', 'theme-tron-ares');
    // Add the selected theme class
    document.body.classList.add(`theme-${themeId}`);
  };

  // Apply theme on initial load
  useEffect(() => {
    if (settings.theme) {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  const accentColors = [
    '#0A84FF', // Blue
    '#30D158', // Green
    '#FF453A', // Red
    '#FF9F0A', // Orange
    '#BF5AF2', // Purple
    '#FF375F', // Pink
    '#64D2FF', // Cyan
    '#FFD60A'  // Yellow
  ];

  const quitApp = () => {
    window.notchAPI?.quitApp();
  };

  return (
    <div className="settings-container">
      <motion.div 
        className="settings-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="section-title">⚙️ General</div>
        
        <div className="setting-row">
          <div className="setting-label">
            <span>🚀</span>
            Launch at Login
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={settings.launchAtLogin}
              onChange={e => updateSetting('launchAtLogin', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <span>🖥️</span>
            Show on All Desktops
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={settings.showOnAllDesktops}
              onChange={e => updateSetting('showOnAllDesktops', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="section-title">🎨 Appearance</div>

        <div className="setting-row theme-row">
          <div className="setting-label">
            <span>🎭</span>
            Theme
          </div>
        </div>
        <div className="theme-selector">
          {THEMES.map(theme => (
            <motion.button
              key={theme.id}
              className={`theme-btn ${settings.theme === theme.id ? 'active' : ''}`}
              onClick={() => updateSetting('theme', theme.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-name">{theme.name}</span>
              <span className="theme-desc">{theme.description}</span>
            </motion.button>
          ))}
        </div>
        
        <div className="setting-row">
          <div className="setting-label">
            <span>🌈</span>
            Accent Color
          </div>
          <div className="color-picker">
            {accentColors.map(color => (
              <motion.button
                key={color}
                className={`color-btn ${settings.accentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => updateSetting('accentColor', color)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        <div className="setting-row slider-row">
          <div className="setting-label">
            <span>📐</span>
            Widget Width
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              min="600" 
              max="900" 
              value={settings.widgetWidth}
              onChange={e => updateSetting('widgetWidth', parseInt(e.target.value))}
            />
            <span className="slider-value">{settings.widgetWidth}px</span>
          </div>
        </div>

        <div className="setting-row slider-row">
          <div className="setting-label">
            <span>📏</span>
            Widget Height
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              min="250" 
              max="400" 
              value={settings.widgetHeight}
              onChange={e => updateSetting('widgetHeight', parseInt(e.target.value))}
            />
            <span className="slider-value">{settings.widgetHeight}px</span>
          </div>
        </div>

        <div className="setting-row slider-row">
          <div className="setting-label">
            <span>🌫️</span>
            Blur Amount
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              min="10" 
              max="80" 
              value={settings.blurAmount}
              onChange={e => updateSetting('blurAmount', parseInt(e.target.value))}
            />
            <span className="slider-value">{settings.blurAmount}px</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="section-title">⏱️ Behavior</div>
        
        <div className="setting-row slider-row">
          <div className="setting-label">
            <span>⏰</span>
            Auto-hide Delay
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              min="1000" 
              max="5000" 
              step="500"
              value={settings.hideDelay}
              onChange={e => updateSetting('hideDelay', parseInt(e.target.value))}
            />
            <span className="slider-value">{(settings.hideDelay / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="section-title">ℹ️ About</div>
        <div className="about-info">
          <p><strong>Notch Widget</strong></p>
          <p className="version">Version 1.0.0</p>
          <p className="desc">A Dynamic Island-inspired widget for MacBook</p>
        </div>
        
        <motion.button 
          className="quit-btn"
          onClick={quitApp}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Quit Notch Widget
        </motion.button>
      </motion.div>
    </div>
  );
}
