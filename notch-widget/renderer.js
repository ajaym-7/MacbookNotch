// Notch Widget - Full Feature Renderer
(function() {
  'use strict';

  // ========== STATE ==========
  let isExpanded = false;
  let currentTab = 'home';
  let notes = [];
  let snippets = [];
  let files = [];
  let playlist = [];
  let currentTrack = -1;
  let timerSeconds = 600; // 10 minutes default
  let timerInterval = null;
  let timerMode = 'countdown'; // 'countdown' or 'stopwatch'
  let stopwatchMs = 0;
  let cameraStream = null;
  let settings = {
    width: 720,
    height: 280,
    accentColor: '#7cc7ff',
    launchAtLogin: false
  };

  // ========== ELEMENTS ==========
  const notch = document.getElementById('notch');
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // ========== INITIALIZATION ==========
  async function init() {
    // Load settings
    try {
      settings = await window.notchAPI.getSettings() || settings;
      applySettings();
    } catch (e) { console.error('Failed to load settings', e); }

    // Load notes
    try {
      notes = await window.notchAPI.getNotes() || [];
      renderNotes();
    } catch (e) { console.error('Failed to load notes', e); }

    // Load snippets
    try {
      snippets = await window.notchAPI.getSnippets() || [];
      renderSnippets();
    } catch (e) { console.error('Failed to load snippets', e); }

    // Setup event listeners
    setupNavigation();
    setupMusic();
    setupWeather();
    setupCalendar();
    setupTimer();
    setupCamera();
    setupClipboard();
    setupFileTray();
    setupSettings();
    setupModals();

    // Start collapsed
    notch.classList.add('collapsed');
  }

  // ========== NAVIGATION ==========
  function setupNavigation() {
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // Click on notch bar to expand/collapse
    document.querySelector('.notch-cutout').addEventListener('click', toggleExpand);
  }

  function switchTab(tabId) {
    currentTab = tabId;

    // Update nav buttons
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Expand if collapsed
    if (!isExpanded) {
      expand();
    }

    // Special handling for camera tab
    if (tabId === 'camera') {
      // Camera will be activated on overlay click
    } else {
      stopCamera();
    }

    // Update clipboard when switching to snippets
    if (tabId === 'snippets') {
      updateClipboard();
    }
  }

  function toggleExpand() {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }

  function expand() {
    isExpanded = true;
    notch.classList.remove('collapsed');
    window.notchAPI.expand();
  }

  function collapse() {
    isExpanded = false;
    notch.classList.add('collapsed');
    window.notchAPI.collapse();
    stopCamera();
  }

  // ========== MUSIC PLAYER ==========
  function setupMusic() {
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const albumArt = document.getElementById('album-art');
    const musicTitle = document.getElementById('music-title');
    const musicArtist = document.getElementById('music-artist');

    playBtn.addEventListener('click', () => {
      if (!audio.src && playlist.length === 0) return;
      if (audio.paused) {
        audio.play();
        playBtn.textContent = '⏸';
      } else {
        audio.pause();
        playBtn.textContent = '▶';
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentTrack > 0) loadTrack(currentTrack - 1);
    });

    nextBtn.addEventListener('click', () => {
      if (currentTrack < playlist.length - 1) loadTrack(currentTrack + 1);
    });

    audio.addEventListener('ended', () => {
      if (currentTrack < playlist.length - 1) {
        loadTrack(currentTrack + 1);
      } else {
        playBtn.textContent = '▶';
      }
    });

    // Allow dropping audio files on music widget
    const musicWidget = document.querySelector('.music-widget');
    musicWidget.addEventListener('dragover', e => { e.preventDefault(); });
    musicWidget.addEventListener('drop', e => {
      e.preventDefault();
      const items = e.dataTransfer.files;
      for (let i = 0; i < items.length; i++) {
        const f = items[i];
        if (/\.(mp3|wav|m4a|ogg|flac)$/i.test(f.path)) {
          playlist.push({ path: f.path, name: f.name.replace(/\.[^.]+$/, '') });
          if (currentTrack === -1) loadTrack(0);
        }
      }
    });
  }

  function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentTrack = index;
    const track = playlist[index];
    const audio = document.getElementById('audio');
    audio.src = track.path;
    document.getElementById('music-title').textContent = track.name;
    document.getElementById('music-artist').textContent = 'Now Playing';
    document.getElementById('album-art').textContent = '🎵';
    audio.play();
    document.getElementById('play-btn').textContent = '⏸';
  }

  // ========== WEATHER ==========
  function setupWeather() {
    fetchWeather();
    // Refresh weather every 30 minutes
    setInterval(fetchWeather, 30 * 60 * 1000);
  }

  async function fetchWeather() {
    try {
      // Try to get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
          const data = await resp.json();
          updateWeatherUI(data);
        }, () => {
          // Fallback: use default location (London)
          fetchDefaultWeather();
        });
      } else {
        fetchDefaultWeather();
      }
    } catch (e) {
      console.error('Weather fetch failed', e);
    }
  }

  async function fetchDefaultWeather() {
    try {
      const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto');
      const data = await resp.json();
      updateWeatherUI(data, 'London');
    } catch (e) {
      console.error('Default weather fetch failed', e);
    }
  }

  function updateWeatherUI(data, location = 'Your Location') {
    const current = data.current;
    const daily = data.daily;
    
    document.getElementById('weather-temp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('weather-icon').textContent = getWeatherIcon(current.weather_code);
    document.getElementById('weather-range').textContent = `${Math.round(daily.temperature_2m_min[0])}°C / ${Math.round(daily.temperature_2m_max[0])}°C`;
    document.getElementById('weather-location').textContent = `📍 ${location}`;
    document.getElementById('weather-condition').textContent = getWeatherCondition(current.weather_code);
  }

  function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    return '⛈️';
  }

  function getWeatherCondition(code) {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  }

  // ========== CALENDAR ==========
  function setupCalendar() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    document.getElementById('cal-month').textContent = months[now.getMonth()];
    document.getElementById('cal-weekday').textContent = days[now.getDay()];
    document.getElementById('cal-day').textContent = now.getDate();

    // Generate mini calendar
    const miniCal = document.getElementById('calendar-mini');
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day headers
    const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dayHeaders.forEach(d => {
      const el = document.createElement('div');
      el.className = 'day header';
      el.textContent = d;
      miniCal.appendChild(el);
    });

    // Offset for Monday start
    const offset = (firstDay + 6) % 7;

    // Empty cells before first day
    for (let i = 0; i < offset; i++) {
      const el = document.createElement('div');
      el.className = 'day';
      miniCal.appendChild(el);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const el = document.createElement('div');
      el.className = 'day';
      el.textContent = d;
      if (d === today) el.classList.add('today');
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) el.classList.add('weekend');
      miniCal.appendChild(el);
    }
  }

  // ========== NOTES ==========
  function renderNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '';

    if (notes.length === 0) {
      // Show sample notes
      const samples = [
        { title: 'Meeting Notes - Q4 Planning', body: 'Discuss budget allocation for new projects. Review team performance metrics...' },
        { title: 'Weekend Project Ideas', body: 'Build a small herb garden on the balcony. Organize photo albums from summer trip...' },
        { title: 'Book Recommendations', body: 'The Design of Everyday Things - Don Norman. Atomic Habits - James Clear...' }
      ];
      samples.forEach((n, i) => {
        notes.push({ id: Date.now() + i, ...n });
      });
    }

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <div class="note-title">${escapeHtml(note.title)}</div>
        <div class="note-body">${escapeHtml(note.body)}</div>
      `;
      card.addEventListener('click', () => editNote(note));
      grid.appendChild(card);
    });
  }

  function editNote(note = null) {
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title');
    const bodyInput = document.getElementById('note-body');

    titleInput.value = note ? note.title : '';
    bodyInput.value = note ? note.body : '';
    modal.classList.add('active');
    modal.dataset.noteId = note ? note.id : '';
  }

  function setupModals() {
    // Note modal
    document.getElementById('add-note').addEventListener('click', () => editNote());
    document.getElementById('note-cancel').addEventListener('click', () => {
      document.getElementById('note-modal').classList.remove('active');
    });
    document.getElementById('note-save').addEventListener('click', async () => {
      const modal = document.getElementById('note-modal');
      const title = document.getElementById('note-title').value.trim();
      const body = document.getElementById('note-body').value.trim();
      const noteId = modal.dataset.noteId;

      if (!title) return;

      if (noteId) {
        const note = notes.find(n => n.id == noteId);
        if (note) {
          note.title = title;
          note.body = body;
        }
      } else {
        notes.push({ id: Date.now(), title, body });
      }

      await window.notchAPI.saveNotes(notes);
      renderNotes();
      modal.classList.remove('active');
    });

    // Snippet modal
    document.getElementById('add-snippet').addEventListener('click', () => editSnippet());
    document.getElementById('snippet-cancel').addEventListener('click', () => {
      document.getElementById('snippet-modal').classList.remove('active');
    });
    document.getElementById('snippet-save').addEventListener('click', async () => {
      const modal = document.getElementById('snippet-modal');
      const title = document.getElementById('snippet-title').value.trim();
      const body = document.getElementById('snippet-body').value.trim();
      const snippetId = modal.dataset.snippetId;

      if (!title || !body) return;

      if (snippetId) {
        const snippet = snippets.find(s => s.id == snippetId);
        if (snippet) {
          snippet.title = title;
          snippet.body = body;
        }
      } else {
        snippets.push({ id: Date.now(), title, body });
      }

      await window.notchAPI.saveSnippets(snippets);
      renderSnippets();
      modal.classList.remove('active');
    });
  }

  function editSnippet(snippet = null) {
    const modal = document.getElementById('snippet-modal');
    const titleInput = document.getElementById('snippet-title');
    const bodyInput = document.getElementById('snippet-body');

    titleInput.value = snippet ? snippet.title : '';
    bodyInput.value = snippet ? snippet.body : '';
    modal.classList.add('active');
    modal.dataset.snippetId = snippet ? snippet.id : '';
  }

  // ========== TIMER ==========
  function setupTimer() {
    const display = document.getElementById('timer-display');
    const playBtn = document.getElementById('timer-play');
    const addBtn = document.getElementById('timer-add');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const modeTabs = document.querySelectorAll('.preset-tab');

    playBtn.addEventListener('click', () => {
      if (timerInterval) {
        // Pause
        clearInterval(timerInterval);
        timerInterval = null;
        playBtn.textContent = '▶';
      } else {
        // Start
        timerInterval = setInterval(() => {
          if (timerMode === 'countdown') {
            if (timerSeconds > 0) {
              timerSeconds--;
              updateTimerDisplay();
            } else {
              clearInterval(timerInterval);
              timerInterval = null;
              playBtn.textContent = '▶';
              // Could add notification here
            }
          } else {
            stopwatchMs += 100;
            updateTimerDisplay();
          }
        }, timerMode === 'countdown' ? 1000 : 100);
        playBtn.textContent = '⏸';
      }
    });

    addBtn.addEventListener('click', () => {
      // Reset timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (timerMode === 'countdown') {
        timerSeconds = 600;
      } else {
        stopwatchMs = 0;
      }
      updateTimerDisplay();
      playBtn.textContent = '▶';
    });

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timerSeconds = parseInt(btn.dataset.time, 10);
        updateTimerDisplay();
      });
    });

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        timerMode = tab.dataset.mode;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
          playBtn.textContent = '▶';
        }
        if (timerMode === 'stopwatch') {
          stopwatchMs = 0;
        }
        updateTimerDisplay();
      });
    });

    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (timerMode === 'countdown') {
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      if (m >= 60) {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        display.textContent = `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else {
        display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    } else {
      const totalSecs = Math.floor(stopwatchMs / 1000);
      const ms = Math.floor((stopwatchMs % 1000) / 100);
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
    }
  }

  // ========== CAMERA ==========
  function setupCamera() {
    const overlay = document.getElementById('camera-overlay');
    const video = document.getElementById('camera-video');
    const captureBtn = document.getElementById('camera-capture');
    const closeBtn = document.getElementById('camera-close');

    overlay.addEventListener('click', startCamera);
    closeBtn.addEventListener('click', stopCamera);
    captureBtn.addEventListener('click', capturePhoto);
  }

  async function startCamera() {
    try {
      const hasPermission = await window.notchAPI.checkCameraPermission();
      if (!hasPermission) {
        alert('Camera permission denied');
        return;
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('camera-video');
      video.srcObject = cameraStream;
      document.getElementById('camera-overlay').classList.add('hidden');
    } catch (e) {
      console.error('Camera error', e);
      alert('Could not access camera');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    const video = document.getElementById('camera-video');
    video.srcObject = null;
    document.getElementById('camera-overlay').classList.remove('hidden');
  }

  function capturePhoto() {
    const video = document.getElementById('camera-video');
    if (!video.srcObject) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    // Could save to clipboard or file
    window.notchAPI.writeClipboard(dataUrl);
    alert('Photo captured to clipboard!');
  }

  // ========== CLIPBOARD / SNIPPETS ==========
  function setupClipboard() {
    updateClipboard();
    // Update clipboard every 2 seconds when on snippets tab
    setInterval(() => {
      if (currentTab === 'snippets') {
        updateClipboard();
      }
    }, 2000);
  }

  async function updateClipboard() {
    try {
      const data = await window.notchAPI.readClipboard();
      const content = document.getElementById('clipboard-content');
      if (data.type === 'text' && data.data) {
        content.textContent = data.data.substring(0, 200) + (data.data.length > 200 ? '...' : '');
      } else if (data.type === 'image') {
        content.innerHTML = '<img src="' + data.data + '" style="max-width:100%;max-height:60px;border-radius:4px;">';
      } else {
        content.textContent = 'No clipboard content';
      }
    } catch (e) {
      console.error('Clipboard error', e);
    }
  }

  function renderSnippets() {
    const grid = document.getElementById('snippets-grid');
    grid.innerHTML = '';

    if (snippets.length === 0) {
      // Sample snippets
      const samples = [
        { title: 'Home Address', body: '20 Cooper Square, New York, NY 100...' },
        { title: 'ID Number', body: '012 33 45 67 89' },
        { title: 'TAX Number', body: '0001 1298 1212 9898' }
      ];
      samples.forEach((s, i) => {
        snippets.push({ id: Date.now() + i, ...s });
      });
    }

    snippets.forEach(snippet => {
      const item = document.createElement('div');
      item.className = 'snippet-item';
      item.innerHTML = `
        <div class="snippet-title">${escapeHtml(snippet.title)}</div>
        <div class="snippet-preview">${escapeHtml(snippet.body)}</div>
      `;
      item.addEventListener('click', async () => {
        await window.notchAPI.writeClipboard(snippet.body);
        updateClipboard();
      });
      grid.appendChild(item);
    });
  }

  // ========== FILE TRAY ==========
  function setupFileTray() {
    const dropZone = document.getElementById('drop-zone');
    const uploadLink = document.getElementById('upload-link');
    const filesList = document.getElementById('files-list');

    ['dragenter', 'dragover'].forEach(ev => {
      dropZone.addEventListener(ev, e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      dropZone.addEventListener(ev, e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', e => {
      const items = e.dataTransfer.files;
      for (let i = 0; i < items.length; i++) {
        addFile(items[i].path, items[i].name);
      }
    });

    uploadLink.addEventListener('click', async e => {
      e.preventDefault();
      const paths = await window.notchAPI.openFileDialog();
      paths.forEach(p => {
        const name = p.split('/').pop();
        addFile(p, name);
      });
    });
  }

  function addFile(path, name) {
    files.push({ path, name });
    renderFiles();
  }

  function renderFiles() {
    const list = document.getElementById('files-list');
    list.innerHTML = '';

    files.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span>📄 ${escapeHtml(f.name)}</span>
        <span class="file-remove" data-index="${i}">✕</span>
      `;
      item.addEventListener('click', e => {
        if (e.target.classList.contains('file-remove')) {
          files.splice(i, 1);
          renderFiles();
        } else {
          window.notchAPI.openPath(f.path);
        }
      });
      list.appendChild(item);
    });
  }

  // ========== SETTINGS ==========
  function setupSettings() {
    const launchCheckbox = document.getElementById('setting-launch');
    const widthSlider = document.getElementById('setting-width');
    const heightSlider = document.getElementById('setting-height');
    const widthValue = document.getElementById('width-value');
    const heightValue = document.getElementById('height-value');
    const colorBtns = document.querySelectorAll('.color-btn');
    const quitBtn = document.getElementById('quit-app');

    launchCheckbox.checked = settings.launchAtLogin;
    widthSlider.value = settings.width;
    heightSlider.value = settings.height;
    widthValue.textContent = settings.width + 'px';
    heightValue.textContent = settings.height + 'px';

    launchCheckbox.addEventListener('change', () => {
      settings.launchAtLogin = launchCheckbox.checked;
      saveSettingsDebounced();
    });

    widthSlider.addEventListener('input', () => {
      settings.width = parseInt(widthSlider.value, 10);
      widthValue.textContent = settings.width + 'px';
      window.notchAPI.setSize(settings.width, settings.height);
      saveSettingsDebounced();
    });

    heightSlider.addEventListener('input', () => {
      settings.height = parseInt(heightSlider.value, 10);
      heightValue.textContent = settings.height + 'px';
      window.notchAPI.setSize(settings.width, settings.height);
      saveSettingsDebounced();
    });

    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        settings.accentColor = btn.dataset.color;
        applySettings();
        saveSettingsDebounced();
      });
    });

    quitBtn.addEventListener('click', () => {
      window.notchAPI.quit();
    });

    // Mark active color
    colorBtns.forEach(btn => {
      if (btn.dataset.color === settings.accentColor) {
        btn.classList.add('active');
      }
    });
  }

  function applySettings() {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
  }

  let saveTimeout;
  function saveSettingsDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      window.notchAPI.saveSettings(settings);
    }, 500);
  }

  // ========== UTILITIES ==========
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  // ========== START ==========
  init();

})();
