const { app, BrowserWindow, screen, ipcMain, shell, dialog, clipboard, systemPreferences, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow = null;
let mouseCheckInterval = null;
let wasNearNotch = false; // Track previous state to only send changes

// Background timer state
let timerState = {
  mode: 'countdown', // countdown | stopwatch
  targetTime: null, // For countdown: when it should end
  startTime: null, // For stopwatch: when it started
  pausedAt: null, // Time remaining when paused (countdown) or elapsed (stopwatch)
  isRunning: false,
  initialDuration: 600 // seconds
};
let timerInterval = null;

// Notch dimensions (approximate for 14"/16" MacBook Pro)
const NOTCH_WIDTH = 210;
const NOTCH_HEIGHT = 36;
const COLLAPSED_HEIGHT = 36;

// Configurable dimensions (loaded from settings)
let expandedHeight = 300;
let winWidth = 700;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

// Settings persistence
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const notesPath = path.join(app.getPath('userData'), 'notes.json');
const snippetsPath = path.join(app.getPath('userData'), 'snippets.json');
const trayFilesPath = path.join(app.getPath('userData'), 'tray-files.json');

function loadJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) { console.error(`Failed to load ${filePath}`, e); }
  return defaultValue;
}

function saveJSON(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); } catch (e) { console.error(e); }
}

function createWindow() {
  // Load saved settings
  const savedSettings = loadJSON(settingsPath, {});
  if (savedSettings.widgetWidth) winWidth = savedSettings.widgetWidth;
  if (savedSettings.widgetHeight) expandedHeight = savedSettings.widgetHeight;
  
  const primary = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primary.size;
  const workArea = primary.workArea;
  
  // Detect if this Mac has a notch (menu bar height > 24 on notch Macs, typically 37+)
  // On MacBook Air M1/M2 without notch: menu bar is 25-33px
  // On MacBook Pro with notch: menu bar is 37+px
  const menuBarHeight = workArea.y;
  const hasNotch = menuBarHeight >= 37;
  
  console.log('[INFO] Menu bar height:', menuBarHeight, '| Has notch:', hasNotch);
  
  // Position at the very top center
  const x = Math.round((screenW - winWidth) / 2);
  
  // For non-notch Macs: position just below menu bar
  // For notch Macs: position at y=0 to overlay the notch area
  const y = hasNotch ? 0 : menuBarHeight;

  mainWindow = new BrowserWindow({
    x,
    y,
    width: winWidth,
    height: COLLAPSED_HEIGHT,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    skipTaskbar: true,
    backgroundColor: '#00000000', // Transparent background
    opacity: 1,
    // type: 'panel', // Temporarily disable panel type
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const htmlPath = path.join(__dirname, 'dist', 'index.html');
    console.log('[INFO] Loading production app from:', htmlPath);
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('[ERROR] Failed to load app:', err);
    });
  }

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[ERROR] Window failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[INFO] Window finished loading successfully');
  });

  // Keep visible on all spaces and even over fullscreen apps
  const showOnAll = savedSettings.showOnAllDesktops !== undefined ? savedSettings.showOnAllDesktops : true;
  mainWindow.setVisibleOnAllWorkspaces(showOnAll, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  
  // Apply launch at login setting - only when explicitly set by user
  const loginItemSettings = {
    openAtLogin: savedSettings.launchAtLogin === true,
    openAsHidden: false
  };
  
  // In production, specify the app path to ensure correct registration
  if (!isDev && process.platform === 'darwin') {
    // Get the path to the .app bundle
    const appPath = path.resolve(app.getPath('exe'), '..', '..', '..');
    loginItemSettings.path = appPath;
    console.log('[INFO] Setting login item path:', appPath);
  }
  
  app.setLoginItemSettings(loginItemSettings);
  console.log('[INFO] Login item settings applied:', app.getLoginItemSettings());
  
  // Show window
  mainWindow.show();
  console.log('[DEBUG] Window shown at:', mainWindow.getBounds());

  // Mouse tracking for auto-show
  startMouseTracking();

  // IPC Handlers
  setupIPC();
}

function startMouseTracking() {
  mouseCheckInterval = setInterval(() => {
    const mousePos = screen.getCursorScreenPoint();
    const primary = screen.getPrimaryDisplay();
    const screenW = primary.size.width;
    const workArea = primary.workArea;
    const menuBarHeight = workArea.y;
    const hasNotch = menuBarHeight >= 37;
    
    // Notch detection zone - the pill area at the top center
    const notchLeft = (screenW - NOTCH_WIDTH) / 2 - 50; // Small buffer
    const notchRight = (screenW + NOTCH_WIDTH) / 2 + 50;
    
    // Only detect entering the notch area at the very top
    const inNotchHorizontal = mousePos.x >= notchLeft && mousePos.x <= notchRight;
    const notchDetectionHeight = hasNotch ? 20 : menuBarHeight + 5;
    const isNearNotch = mousePos.y <= notchDetectionHeight && inNotchHorizontal;
    
    // Only send message when state changes from false to true (entering notch area)
    if (isNearNotch && !wasNearNotch) {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('mouse-near-notch', true);
      }
    }
    wasNearNotch = isNearNotch;
  }, 50);
}

function setupIPC() {
  ipcMain.handle('expand', () => {
    if (mainWindow) {
      mainWindow.setSize(winWidth, expandedHeight, true);
    }
  });

  ipcMain.handle('collapse', () => {
    if (mainWindow) {
      mainWindow.setSize(winWidth, COLLAPSED_HEIGHT, true);
    }
  });

  ipcMain.handle('reset-position', async () => {
    if (mainWindow) {
      const primary = screen.getPrimaryDisplay();
      const screenW = primary.size.width;
      const workArea = primary.workArea;
      const menuBarHeight = workArea.y;
      const hasNotch = menuBarHeight >= 37;
      
      const targetX = Math.round((screenW - winWidth) / 2);
      const targetY = hasNotch ? 0 : menuBarHeight;
      const currentBounds = mainWindow.getBounds();
      
      // Smooth animation using requestAnimationFrame-like approach
      const duration = 300; // ms
      const steps = 20;
      const stepDuration = duration / steps;
      const deltaX = (targetX - currentBounds.x) / steps;
      const deltaY = (targetY - currentBounds.y) / steps;
      
      for (let i = 1; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        const progress = i / steps;
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const newX = Math.round(currentBounds.x + deltaX * steps * eased);
        const newY = Math.round(currentBounds.y + deltaY * steps * eased);
        mainWindow.setPosition(newX, newY, false);
      }
      
      // Ensure final position is exact
      mainWindow.setPosition(targetX, targetY, false);
    }
  });

  ipcMain.handle('get-notch-info', () => ({
    notchWidth: NOTCH_WIDTH,
    notchHeight: NOTCH_HEIGHT,
    windowWidth: winWidth,
    windowHeight: expandedHeight
  }));
  
  // Apply settings in real-time
  ipcMain.handle('apply-settings', (_, settings) => {
    if (!mainWindow) return { ok: false };
    
    const primary = screen.getPrimaryDisplay();
    const screenW = primary.size.width;
    
    // Update dimensions
    if (settings.widgetWidth) {
      winWidth = settings.widgetWidth;
      const x = Math.round((screenW - winWidth) / 2);
      mainWindow.setBounds({ x, width: winWidth });
    }
    if (settings.widgetHeight) {
      expandedHeight = settings.widgetHeight;
      // Only update height if currently expanded
      const currentHeight = mainWindow.getBounds().height;
      if (currentHeight > COLLAPSED_HEIGHT) {
        mainWindow.setSize(winWidth, expandedHeight, true);
      }
    }
    
    // Update launch at login - only when explicitly set by user
    if (settings.launchAtLogin !== undefined) {
      const loginItemSettings = {
        openAtLogin: settings.launchAtLogin === true,
        openAsHidden: false
      };
      
      // In production, specify the app path to ensure correct registration
      if (!isDev && process.platform === 'darwin') {
        const appPath = path.resolve(app.getPath('exe'), '..', '..', '..');
        loginItemSettings.path = appPath;
      }
      
      app.setLoginItemSettings(loginItemSettings);
    }
    
    // Update show on all desktops
    if (settings.showOnAllDesktops !== undefined) {
      mainWindow.setVisibleOnAllWorkspaces(settings.showOnAllDesktops, { visibleOnFullScreen: true });
    }
    
    return { ok: true };
  });

  ipcMain.handle('get-login-item-settings', () => {
    return app.getLoginItemSettings();
  });

  ipcMain.handle('open-path', async (_, filePath) => {
    const r = await shell.openPath(filePath);
    return { ok: r === '', message: r };
  });

  ipcMain.handle('open-file', async (_, filePath) => {
    const r = await shell.openPath(filePath);
    return { ok: r === '', message: r };
  });

  ipcMain.handle('show-item-in-folder', (_, filePath) => {
    shell.showItemInFolder(filePath);
    return { ok: true };
  });

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections']
    });
    if (result.filePaths && result.filePaths.length > 0) {
      // Return file info with size
      return result.filePaths.map(filePath => {
        try {
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            name: path.basename(filePath),
            size: stats.size
          };
        } catch (e) {
          return {
            path: filePath,
            name: path.basename(filePath),
            size: 0
          };
        }
      });
    }
    return [];
  });

  ipcMain.handle('read-clipboard', () => {
    const text = clipboard.readText();
    const image = clipboard.readImage();
    if (!image.isEmpty()) return { type: 'image', data: image.toDataURL() };
    return { type: 'text', data: text };
  });

  ipcMain.handle('write-clipboard', (_, text) => {
    clipboard.writeText(text);
    return { ok: true };
  });

  ipcMain.handle('get-settings', () => loadJSON(settingsPath, {}));
  ipcMain.handle('save-settings', (_, data) => { saveJSON(settingsPath, data); return { ok: true }; });

  ipcMain.handle('get-notes', () => loadJSON(notesPath, []));
  ipcMain.handle('save-notes', (_, data) => { saveJSON(notesPath, data); return { ok: true }; });

  ipcMain.handle('get-snippets', () => loadJSON(snippetsPath, []));
  ipcMain.handle('save-snippets', (_, data) => { saveJSON(snippetsPath, data); return { ok: true }; });

  ipcMain.handle('get-tray-files', () => loadJSON(trayFilesPath, []));
  ipcMain.handle('save-tray-files', (_, data) => { saveJSON(trayFilesPath, data); return { ok: true }; });

  // Open macOS apps
  ipcMain.handle('open-app', async (_, appName) => {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`open -a "${appName}"`, (error) => {
        resolve({ ok: !error, error: error?.message });
      });
    });
  });

  // Get Now Playing info using AppleScript (with artwork and position)
  ipcMain.handle('get-now-playing', async () => {
    const { exec } = require('child_process');
    
    // Try Spotify first (easier artwork URL)
    try {
      const spotifyResult = await new Promise((resolve) => {
        const script = `
          tell application "System Events"
            if (name of processes) contains "Spotify" then
              tell application "Spotify"
                set playerState to player state as string
                if playerState is "playing" or playerState is "paused" then
                  set trackName to name of current track
                  set artistName to artist of current track
                  set artworkUrl to artwork url of current track
                  set trackDuration to duration of current track
                  set playerPos to player position
                  return playerState & "|" & trackName & "|" & artistName & "|Spotify|" & artworkUrl & "|" & (trackDuration / 1000) & "|" & playerPos
                end if
              end tell
            end if
          end tell
          return ""
        `;
        exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error, stdout) => {
          if (!error && stdout.trim()) {
            const parts = stdout.trim().split('|');
            if (parts.length >= 4) {
              resolve({
                isPlaying: parts[0] === 'playing',
                title: parts[1] || 'Unknown',
                artist: parts[2] || '',
                app: parts[3] || 'Spotify',
                artworkUrl: parts[4] || null,
                duration: parseFloat(parts[5]) || 0,
                position: parseFloat(parts[6]) || 0
              });
              return;
            }
          }
          resolve(null);
        });
      });
      if (spotifyResult) return spotifyResult;
    } catch (e) {}

    // Try Apple Music (artwork requires temp file)
    try {
      const musicResult = await new Promise((resolve) => {
        const tempPath = path.join(app.getPath('temp'), 'now-playing-artwork.jpg');
        const script = `
          tell application "System Events"
            if (name of processes) contains "Music" then
              tell application "Music"
                set playerState to player state as string
                if playerState is "playing" or playerState is "paused" then
                  set trackName to name of current track
                  set artistName to artist of current track
                  set trackDuration to duration of current track
                  set playerPos to player position
                  try
                    set artworkData to raw data of artwork 1 of current track
                    set artworkFile to open for access POSIX file "${tempPath}" with write permission
                    write artworkData to artworkFile
                    close access artworkFile
                    return playerState & "|" & trackName & "|" & artistName & "|Music|${tempPath}|" & trackDuration & "|" & playerPos
                  on error
                    return playerState & "|" & trackName & "|" & artistName & "|Music||" & trackDuration & "|" & playerPos
                  end try
                end if
              end tell
            end if
          end tell
          return ""
        `;
        exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error, stdout) => {
          if (!error && stdout.trim()) {
            const parts = stdout.trim().split('|');
            if (parts.length >= 4) {
              let artworkUrl = null;
              if (parts[4] && fs.existsSync(parts[4])) {
                artworkUrl = 'file://' + parts[4] + '?t=' + Date.now();
              }
              resolve({
                isPlaying: parts[0] === 'playing',
                title: parts[1] || 'Unknown',
                artist: parts[2] || '',
                app: 'Music',
                artworkUrl,
                duration: parseFloat(parts[5]) || 0,
                position: parseFloat(parts[6]) || 0
              });
              return;
            }
          }
          resolve(null);
        });
      });
      if (musicResult) return musicResult;
    } catch (e) {}
    
    return { title: 'No media playing', artist: 'Click to open Music', app: 'Music', isPlaying: false, artworkUrl: null, duration: 0, position: 0 };
  });

  // Media control using system key events
  ipcMain.handle('media-control', async (_, action) => {
    const { exec } = require('child_process');
    
    // Use AppleScript to control media apps directly
    const scripts = {
      playpause: `
        tell application "System Events"
          if (name of processes) contains "Spotify" then
            tell application "Spotify" to playpause
          else if (name of processes) contains "Music" then
            tell application "Music" to playpause
          end if
        end tell
      `,
      previous: `
        tell application "System Events"
          if (name of processes) contains "Spotify" then
            tell application "Spotify" to previous track
          else if (name of processes) contains "Music" then
            tell application "Music" to back track
          end if
        end tell
      `,
      next: `
        tell application "System Events"
          if (name of processes) contains "Spotify" then
            tell application "Spotify" to next track
          else if (name of processes) contains "Music" then
            tell application "Music" to next track
          end if
        end tell
      `
    };
    
    if (scripts[action]) {
      return new Promise((resolve) => {
        exec(`osascript -e '${scripts[action].replace(/'/g, "'\\''")}'`, (error) => {
          resolve({ ok: !error });
        });
      });
    }
    return { ok: false };
  });

  // Open AirDrop
  ipcMain.handle('open-airdrop', async () => {
    const { exec } = require('child_process');
    exec('open -b com.apple.share.AirDrop.send');
    return { ok: true };
  });

  // Share files via AirDrop
  ipcMain.handle('share-via-airdrop', async (_, filePaths) => {
    if (!filePaths || filePaths.length === 0) {
      exec('open -b com.apple.share.AirDrop.send');
      return { ok: true };
    }
    
    // Use open command to trigger share sheet which includes AirDrop
    // This is more reliable than AppleScript on recent macOS versions
    try {
      // For single file
      if (filePaths.length === 1) {
        exec(`open "${filePaths[0]}" -a Finder && sleep 0.2 && osascript -e 'tell application "System Events" to keystroke "i" using {command down, shift down}'`);
      } else {
        // For multiple files, open them in Finder
        const escapedPaths = filePaths.map(p => `"${p.replace(/"/g, '\\"')}"`).join(' ');
        exec(`open -R ${escapedPaths}`);
      }
      return { ok: true };
    } catch (error) {
      console.error('AirDrop error:', error);
      // Fallback to just opening AirDrop
      exec('open -b com.apple.share.AirDrop.send');
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('check-camera-permission', async () => {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('camera');
      if (status === 'not-determined') return await systemPreferences.askForMediaAccess('camera');
      return status === 'granted';
    }
    return true;
  });

  // Timer notification with system sound
  ipcMain.handle('show-timer-notification', async (_, title, body) => {
    // Play system alert sound using macOS
    exec('afplay /System/Library/Sounds/Glass.aiff');
    
    // Show system notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'Timer Complete!',
        body: body || 'Your timer has finished.',
        sound: 'Glass', // macOS notification sound
        urgency: 'critical'
      });
      notification.show();
    }
    return { ok: true };
  });

  // Background timer handlers
  ipcMain.handle('timer-start', (_, mode, duration) => {
    timerState.mode = mode;
    timerState.isRunning = true;
    timerState.initialDuration = duration || 600;
    
    if (mode === 'countdown') {
      if (timerState.pausedAt !== null) {
        // Resume from paused state
        timerState.targetTime = Date.now() + timerState.pausedAt * 1000;
      } else {
        timerState.targetTime = Date.now() + timerState.initialDuration * 1000;
      }
      timerState.pausedAt = null;
    } else {
      // Stopwatch
      if (timerState.pausedAt !== null) {
        timerState.startTime = Date.now() - timerState.pausedAt;
      } else {
        timerState.startTime = Date.now();
      }
      timerState.pausedAt = null;
    }
    
    // Start checking timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!timerState.isRunning) return;
      
      if (timerState.mode === 'countdown') {
        const remaining = Math.max(0, Math.ceil((timerState.targetTime - Date.now()) / 1000));
        if (remaining <= 0) {
          // Timer complete!
          timerState.isRunning = false;
          timerState.pausedAt = 0;
          clearInterval(timerInterval);
          
          // Play alarm
          exec('afplay /System/Library/Sounds/Glass.aiff');
          if (Notification.isSupported()) {
            const notification = new Notification({
              title: 'Timer Complete!',
              body: 'Your countdown has finished.',
              sound: 'Glass'
            });
            notification.show();
          }
          
          // Notify renderer
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('timer-complete');
          }
        }
      }
    }, 100);
    
    return { ok: true };
  });

  ipcMain.handle('timer-pause', () => {
    if (timerState.isRunning) {
      timerState.isRunning = false;
      if (timerState.mode === 'countdown') {
        timerState.pausedAt = Math.max(0, Math.ceil((timerState.targetTime - Date.now()) / 1000));
      } else {
        timerState.pausedAt = Date.now() - timerState.startTime;
      }
    }
    return { ok: true };
  });

  ipcMain.handle('timer-reset', (_, duration) => {
    timerState.isRunning = false;
    timerState.pausedAt = null;
    timerState.initialDuration = duration || timerState.initialDuration;
    if (timerInterval) clearInterval(timerInterval);
    return { ok: true };
  });

  ipcMain.handle('timer-set-duration', (_, duration) => {
    timerState.initialDuration = duration;
    timerState.pausedAt = null;
    timerState.isRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    return { ok: true };
  });

  ipcMain.handle('timer-get-state', () => {
    let currentValue = 0;
    if (timerState.mode === 'countdown') {
      if (timerState.isRunning) {
        currentValue = Math.max(0, Math.ceil((timerState.targetTime - Date.now()) / 1000));
      } else if (timerState.pausedAt !== null) {
        currentValue = timerState.pausedAt;
      } else {
        currentValue = timerState.initialDuration;
      }
    } else {
      if (timerState.isRunning) {
        currentValue = Date.now() - timerState.startTime;
      } else if (timerState.pausedAt !== null) {
        currentValue = timerState.pausedAt;
      } else {
        currentValue = 0;
      }
    }
    return {
      mode: timerState.mode,
      isRunning: timerState.isRunning,
      currentValue,
      initialDuration: timerState.initialDuration
    };
  });

  ipcMain.handle('timer-set-mode', (_, mode) => {
    timerState.mode = mode;
    timerState.isRunning = false;
    timerState.pausedAt = null;
    if (timerInterval) clearInterval(timerInterval);
    return { ok: true };
  });

  ipcMain.handle('quit-app', () => app.quit());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (mouseCheckInterval) clearInterval(mouseCheckInterval);
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
