const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notchAPI', {
  // Window control
  expand: () => ipcRenderer.invoke('expand'),
  collapse: () => ipcRenderer.invoke('collapse'),
  resetPosition: () => ipcRenderer.invoke('reset-position'),
  getNotchInfo: () => ipcRenderer.invoke('get-notch-info'),

  // Mouse tracking
  onMouseNearNotch: (callback) => {
    ipcRenderer.on('mouse-near-notch', (_, isNear) => callback(isNear));
  },

  // File operations
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  openFile: (p) => ipcRenderer.invoke('open-file', p),
  showItemInFolder: (p) => ipcRenderer.invoke('show-item-in-folder', p),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // App launching
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),

  // Now Playing & Media control
  getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),

  // AirDrop
  openAirDrop: () => ipcRenderer.invoke('open-airdrop'),
  shareViaAirDrop: (filePaths) => ipcRenderer.invoke('share-via-airdrop', filePaths),

  // Clipboard
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),

  // Data persistence
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (data) => ipcRenderer.invoke('save-settings', data),
  applySettings: (settings) => ipcRenderer.invoke('apply-settings', settings),
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (data) => ipcRenderer.invoke('save-notes', data),
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  saveSnippets: (data) => ipcRenderer.invoke('save-snippets', data),
  getTrayFiles: () => ipcRenderer.invoke('get-tray-files'),
  saveTrayFiles: (data) => ipcRenderer.invoke('save-tray-files', data),

  // System
  checkCameraPermission: () => ipcRenderer.invoke('check-camera-permission'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Timer notifications
  showTimerNotification: (title, body) => ipcRenderer.invoke('show-timer-notification', title, body),

  // Background timer
  timerStart: (mode, duration) => ipcRenderer.invoke('timer-start', mode, duration),
  timerPause: () => ipcRenderer.invoke('timer-pause'),
  timerReset: (duration) => ipcRenderer.invoke('timer-reset', duration),
  timerSetDuration: (duration) => ipcRenderer.invoke('timer-set-duration', duration),
  timerGetState: () => ipcRenderer.invoke('timer-get-state'),
  timerSetMode: (mode) => ipcRenderer.invoke('timer-set-mode', mode),
  onTimerComplete: (callback) => {
    ipcRenderer.on('timer-complete', () => callback());
  }
});
