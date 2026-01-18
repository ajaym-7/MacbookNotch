import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from '../Icons';

// Memoized weather animation components - only re-render when necessary
const StarrySky = memo(() => {
  const stars = useMemo(() => [...Array(25)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    size: `${1 + Math.random() * 2}px`,
  })), []);
  
  return (
    <div className="weather-animation starry">
      {stars.map(star => (
        <div key={star.id} className="star" style={{
          left: star.left,
          top: star.top,
          animationDelay: star.delay,
          width: star.size,
          height: star.size,
        }} />
      ))}
      <div className="moon" />
    </div>
  );
});

const SunnySky = memo(() => (
  <div className="weather-animation sunny">
    <div className="sun">
      <div className="sun-core" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="sun-ray" style={{ transform: `rotate(${i * 45}deg)` }} />
      ))}
    </div>
    <div className="sun-haze" />
  </div>
));

const CloudySky = memo(() => (
  <div className="weather-animation cloudy">
    <div className="cloud cloud-1" />
    <div className="cloud cloud-2" />
    <div className="cloud cloud-3" />
  </div>
));

const RainySky = memo(() => {
  const raindrops = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1}s`,
    duration: `${0.4 + Math.random() * 0.2}s`,
  })), []);
  
  return (
    <div className="weather-animation rainy">
      <div className="rain-clouds">
        <div className="cloud cloud-dark cloud-1" />
        <div className="cloud cloud-dark cloud-2" />
      </div>
      {raindrops.map(drop => (
        <div key={drop.id} className="raindrop" style={{
          left: drop.left,
          animationDelay: drop.delay,
          animationDuration: drop.duration,
        }} />
      ))}
    </div>
  );
});

const SnowySky = memo(() => {
  const snowflakes = useMemo(() => [...Array(30)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
  })), []);
  
  return (
    <div className="weather-animation snowy">
      {snowflakes.map(flake => (
        <div key={flake.id} className="snowflake" style={{
          left: flake.left,
          animationDelay: flake.delay,
          animationDuration: flake.duration,
          fontSize: flake.size,
        }}>❄</div>
      ))}
    </div>
  );
});

const FoggySky = memo(() => (
  <div className="weather-animation foggy">
    <div className="fog fog-1" />
    <div className="fog fog-2" />
    <div className="fog fog-3" />
  </div>
));

const ThunderSky = memo(() => {
  const raindrops = useMemo(() => [...Array(15)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${0.3 + Math.random() * 0.2}s`,
  })), []);
  
  return (
    <div className="weather-animation thunder">
      <div className="rain-clouds">
        <div className="cloud cloud-dark cloud-1" />
        <div className="cloud cloud-dark cloud-2" />
      </div>
      {raindrops.map(drop => (
        <div key={drop.id} className="raindrop" style={{
          left: drop.left,
          animationDelay: drop.delay,
          animationDuration: drop.duration,
        }} />
      ))}
      <div className="lightning" />
    </div>
  );
});

// Constants moved outside component
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEATHER_ICONS = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌧️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️', 85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
const WEATHER_CONDITIONS = { 0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy', 45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains', 80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers', 85: 'Snow Showers', 86: 'Heavy Snow', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe Storm' };

export default function HomeTab() {
  const [weather, setWeather] = useState({ temp: '--', icon: '☀️', min: '--', max: '--', location: 'Loading...', condition: 'Clear', code: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({ title: 'No media playing', artist: 'Click to open Music', app: 'Music', artworkUrl: null, duration: 0, position: 0 });
  const [currentPosition, setCurrentPosition] = useState(0);

  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const isNight = hour < 6 || hour >= 18;

  const updateWeather = useCallback((data, location) => {
    const code = data.current.weather_code;
    setWeather({
      temp: Math.round(data.current.temperature_2m),
      icon: WEATHER_ICONS[code] || '🌡️',
      min: Math.round(data.daily.temperature_2m_min[0]),
      max: Math.round(data.daily.temperature_2m_max[0]),
      location,
      condition: WEATHER_CONDITIONS[code] || 'Unknown',
      code
    });
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
          const data = await resp.json();
          updateWeather(data, 'Your Location');
        }, async () => {
          const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=22.7196&longitude=75.8577&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto');
          const data = await resp.json();
          updateWeather(data, 'Indore');
        });
      } catch (e) { console.error('Weather error', e); }
    };
    fetchWeather();
    // Refresh weather every 10 minutes instead of on every render
    const weatherInterval = setInterval(fetchWeather, 600000);
    return () => clearInterval(weatherInterval);
  }, [updateWeather]);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const data = await window.notchAPI?.getNowPlaying();
      if (data && data.title) {
        setNowPlaying(data);
        setIsPlaying(data.isPlaying);
        setCurrentPosition(data.position || 0);
      }
    };
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update position locally when playing for smoother animation
  useEffect(() => {
    if (isPlaying && nowPlaying.duration > 0) {
      const timer = setInterval(() => {
        setCurrentPosition(prev => {
          if (prev >= nowPlaying.duration) return prev;
          return prev + 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [isPlaying, nowPlaying.duration]);

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatRemainingTime = useCallback((position, duration) => {
    if (!duration || isNaN(duration)) return '-0:00';
    const remaining = duration - position;
    if (remaining <= 0) return '-0:00';
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `-${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get weather animation based on weather code - memoized
  const getWeatherAnimation = useCallback(() => {
    const code = weather.code;
    
    // Thunder/Storm (95-99)
    if (code >= 95) return <ThunderSky />;
    
    // Snow (71-77, 85-86)
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <SnowySky />;
    
    // Rain (51-65, 80-82)
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return <RainySky />;
    
    // Fog (45-48)
    if (code >= 45 && code <= 48) return <FoggySky />;
    
    // Cloudy (3)
    if (code === 3) return <CloudySky />;
    
    // Partly cloudy (2) - show clouds with sun or moon
    if (code === 2) return isNight ? <><StarrySky /><CloudySky /></> : <><SunnySky /><CloudySky /></>;
    
    // Clear or mostly clear (0-1)
    if (isNight) return <StarrySky />;
    return <SunnySky />;
  }, [weather.code, isNight]);

  // Get weather background gradient based on conditions - memoized
  const getWeatherBackground = useMemo(() => {
    const code = weather.code;
    
    if (code >= 95) return 'linear-gradient(180deg, #1a1a2e 0%, #2d2d44 50%, #4a4a6a 100%)'; // Storm
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'linear-gradient(180deg, #e8eef2 0%, #c9d6df 50%, #a8c0ce 100%)'; // Snow
    if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return 'linear-gradient(180deg, #3d4f5f 0%, #4a6072 50%, #5a7082 100%)'; // Rain
    if (code >= 45 && code <= 48) return 'linear-gradient(180deg, #8e9eab 0%, #a8b5c2 50%, #c4cfd6 100%)'; // Fog
    if (code === 3) return 'linear-gradient(180deg, #606c88 0%, #7a8598 50%, #949fac 100%)'; // Cloudy
    if (code === 2) return isNight ? 'linear-gradient(180deg, #0a1628 0%, #1a2a4a 50%, #2a3a5a 100%)' : 'linear-gradient(180deg, #4a90c2 0%, #6aa8d4 50%, #8ac0e6 100%)'; // Partly cloudy
    
    // Clear
    if (isNight) return 'linear-gradient(180deg, #0a1628 0%, #162544 50%, #1e3a5f 100%)';
    return 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 50%, #6b9bc3 100%)';
  }, [weather.code, isNight]);

  // Memoize calendar generation
  const calendarCells = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => {
      cells.push(<div key={`h-${i}`} className="day-header">{d}</div>);
    });
    
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="day empty" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isWeekend = new Date(year, month, d).getDay() % 6 === 0;
      cells.push(
        <div key={d} className={`day ${d === today ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>{d}</div>
      );
    }
    return cells;
  }, [now]);

  // Memoize event handlers
  const handlePlayPause = useCallback(async (e) => { e.stopPropagation(); await window.notchAPI?.mediaControl('playpause'); setIsPlaying(!isPlaying); }, [isPlaying]);
  const handlePrev = useCallback(async (e) => { e.stopPropagation(); await window.notchAPI?.mediaControl('previous'); }, []);
  const handleNext = useCallback(async (e) => { e.stopPropagation(); await window.notchAPI?.mediaControl('next'); }, []);
  const openMusicApp = useCallback(async () => { await window.notchAPI?.openApp(nowPlaying.app || 'Music'); }, [nowPlaying.app]);
  const openWeatherApp = useCallback(async () => { await window.notchAPI?.openApp('Weather'); }, []);
  const openCalendarApp = useCallback(async () => { await window.notchAPI?.openApp('Calendar'); }, []);

  const progressPercent = nowPlaying.duration > 0 ? (currentPosition / nowPlaying.duration) * 100 : 0;

  return (
    <div className="home-grid">
      {/* Now Playing - Vertical layout */}
      <motion.div className="widget music-widget" onClick={openMusicApp}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <div className="music-artwork-large">
          {nowPlaying.artworkUrl ? (
            <img 
              src={nowPlaying.artworkUrl} 
              alt="" 
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className="artwork-placeholder" style={{ display: nowPlaying.artworkUrl ? 'none' : 'flex' }}>♪</div>
        </div>
        <div className="music-info-vertical">
          <span className="music-app">{nowPlaying.app}</span>
          <span className="music-title">{nowPlaying.title}</span>
          <span className="music-artist">{nowPlaying.artist}</span>
        </div>
        {/* Progress bar */}
        <div className="music-progress-container">
          <div className="music-progress-bar">
            <div className="music-progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            <div className="music-progress-knob" style={{ left: `${Math.min(progressPercent, 100)}%` }} />
          </div>
          <div className="music-progress-times">
            <span className="music-time-current">{formatTime(currentPosition)}</span>
            <span className="music-time-remaining">{formatRemainingTime(currentPosition, nowPlaying.duration)}</span>
          </div>
        </div>
        <div className="music-controls-bottom">
          <motion.button onClick={handlePrev} whileTap={{ scale: 0.85 }}><SkipBack size={14} /></motion.button>
          <motion.button className="primary" onClick={handlePlayPause} whileTap={{ scale: 0.85 }}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </motion.button>
          <motion.button onClick={handleNext} whileTap={{ scale: 0.85 }}><SkipForward size={14} /></motion.button>
        </div>
      </motion.div>

      {/* Weather */}
      <motion.div 
        className="widget weather-widget" 
        onClick={openWeatherApp}
        style={{ background: getWeatherBackground }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        {getWeatherAnimation()}
        <div className="weather-content">
          <div className="weather-location-label">MY LOCATION</div>
          <div className="weather-city">{weather.location}</div>
          <div className="weather-temp">{weather.temp}°</div>
          <div className="weather-condition">{weather.condition}</div>
          <div className="weather-range">H:{weather.max}° L:{weather.min}°</div>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div className="widget calendar-widget" onClick={openCalendarApp}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <div className="calendar-header">
          <span className="calendar-month">{MONTHS[now.getMonth()]}</span>
          <span className="calendar-year">{now.getFullYear()}</span>
        </div>
        <div className="calendar-today">
          <span className="today-day">{DAYS[now.getDay()]}</span>
          <span className="today-date">{now.getDate()}</span>
        </div>
        <div className="calendar-grid">{calendarCells}</div>
      </motion.div>
    </div>
  );
}
