# Keyboard Visualizer — todo

Build a macOS menu-bar Electron app that visualizes typing on an on-screen
60% ANSI mechanical keyboard with retro-90s sticker-pack vibes.

## Plan

- [x] Scaffold `keyboard-visualizer/` directory at repo root
- [x] `package.json` — Electron + uiohook-napi deps, `npm start` script
- [x] `main.js` — tray icon, popup BrowserWindow (frame-less, hidden dock),
      click-to-toggle under tray, hide-on-blur, hide-on-close, uiohook-napi
      global key capture forwarded via `webContents.send('key', …)`
- [x] `preload.js` — contextBridge exposes `window.keyboard.onKey` and
      `window.keyboard.loadSamples()` (reads `uploads/*.wav|mp3` as
      ArrayBuffers)
- [x] `index.html` — case + toolbar (mode switch) + keyboard container,
      noise + scanline overlays, Google Fonts (IBM Plex Mono + VT323)
- [x] `styles.css` — cream-on-cream palette, thick black borders, hard
      offset drop shadows, translate-on-press, yellow modifiers, red
      Enter/Backspace, scanlines, SVG noise overlay
- [x] `renderer.js` — 60% ANSI layout array, uiohook→keycap-id map,
      builder for keycaps + inline-SVG star/heart stickers (key + case),
      Web Audio engine with 4 modes (osc-sweep click, filtered noise,
      two cached samples)
- [x] `uploads/.gitkeep` + README hint for drop-in audio samples
- [x] Commit + push to `claude/keyboard-visualizer-app-7Q2Yf`

## Review

The app is a self-contained tray app in `keyboard-visualizer/`. Run with
`cd keyboard-visualizer && npm install && npm start`. macOS will prompt
for Accessibility permission on first launch (required by uiohook-napi
to capture global keystrokes). Drop one or two `.wav`/`.mp3` files into
`uploads/` to enable the SMPL1/SMPL2 sound modes — synth modes work
without any setup.
