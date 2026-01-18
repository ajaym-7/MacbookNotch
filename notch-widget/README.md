# Notch Widget

A beautiful, productivity-focused macOS menu bar widget that utilizes the MacBook Pro's notch area. Built with Electron, React, and Framer Motion for smooth animations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.0-green.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

## ✨ Features

### 🍅 Pomodoro Timer
- Customizable countdown timer (default: 25 minutes)
- Stopwatch mode for flexible time tracking
- Visual and audio notifications when timer completes
- Pause/resume functionality

### 🎵 Media Player
- Drag and drop audio files to play
- Playlist management
- Basic playback controls (play, pause, skip)
- Volume control

### 📁 Files Tray
- Quick access to frequently used files
- Drag and drop files into the notch widget
- One-click to open files or show in Finder
- Persistent file list across sessions

### 📝 Notes & Snippets
- Quick note-taking without leaving your workflow
- Code snippet storage
- Persistent storage

### ⚙️ Customization
- Adjustable widget dimensions
- Theme support
- Configurable timer durations

## 🖥️ System Requirements

- macOS 11.0 (Big Sur) or later
- MacBook Pro with notch (14" or 16" models)
- Node.js 16.x or later
- npm 7.x or later

## 🚀 Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MacbookNotch.git
   cd MacbookNotch/notch-widget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   This will launch both the Vite dev server and the Electron app.

### For Production Use

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Package the app**
   ```bash
   npm run package
   ```
   This creates a distributable `.dmg` and `.zip` in the `release/` folder.

## 📖 Usage

### Basic Operation

- **Hover near the notch** - The widget automatically expands when your cursor approaches
- **Click anywhere outside** - Widget collapses back to notch area
- **Drag and drop** - Add files or audio directly onto the widget

### Timer Controls

- Click the timer display to switch between countdown/stopwatch modes
- Use the start/pause/reset buttons in the timer tab
- Adjust duration in the settings

### Media Player

- Drag audio files onto the widget
- Use playback controls to manage your playlist
- Adjust volume with the slider

### Files Tray

- Drag files from Finder onto the widget
- Click a file to open it
- Right-click for options (Show in Finder, Remove)

## 🛠️ Development

### Project Structure

```
notch-widget/
├── main.js           # Electron main process
├── preload.js        # Preload script for IPC
├── renderer.js       # Renderer process entry
├── index.html        # App HTML template
├── vite.config.js    # Vite configuration
├── src/              # React source files
│   ├── App.jsx       # Main React component
│   ├── Icons.jsx     # Icon components
│   ├── tabs/         # Tab components
│   └── styles.css    # Styles
└── package.json      # Project configuration
```

### Available Scripts

- `npm start` - Start development mode (Vite + Electron)
- `npm run dev` - Start Vite dev server only
- `npm run build` - Build the React app
- `npm run electron` - Run Electron (requires built files)
- `npm run package` - Build and package for distribution
- `npm run package:dir` - Package without creating installer

### Technology Stack

- **Electron** - Cross-platform desktop app framework
- **React** - UI framework
- **Framer Motion** - Animation library
- **Vite** - Build tool and dev server
- **Node.js** - Backend runtime

## 🎨 Customization

### Adjusting Widget Dimensions

Edit the dimensions in `main.js`:
```javascript
const NOTCH_WIDTH = 210;
const NOTCH_HEIGHT = 36;
let expandedHeight = 300;
let winWidth = 700;
```

### Theme Customization

Modify styles in `src/styles.css` to match your system theme. The notch cutout and menu bar background may vary by macOS appearance settings.

## ⚠️ Known Issues

- Menu bar background rendering may vary by macOS theme
- Notch cutout appearance depends on system appearance settings
- App requires accessibility permissions for some features

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)
- UI built with [React](https://react.dev/)

## 📧 Support

For issues, questions, or suggestions, please [open an issue](https://github.com/yourusername/MacbookNotch/issues) on GitHub.

---

**Note:** This is a prototype application. For production use, consider implementing proper code signing and notarization for macOS distribution.
