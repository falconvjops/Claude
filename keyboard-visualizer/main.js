const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const { uIOhook } = require('uiohook-napi');

const WIN_WIDTH = 900;
const WIN_HEIGHT = 340;

let tray = null;
let win = null;
let isQuitting = false;

function createWindow() {
  win = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#f3e7c9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'index.html'));

  win.on('blur', () => {
    if (!win || win.isDestroyed()) return;
    if (win.webContents.isDevToolsOpened()) return;
    win.hide();
  });

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function positionWindow() {
  if (!tray || !win) return;
  const trayBounds = tray.getBounds();
  const winBounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x || 0,
    y: trayBounds.y || 0,
  });

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  const minX = display.workArea.x + 4;
  const maxX = display.workArea.x + display.workArea.width - winBounds.width - 4;
  x = Math.max(minX, Math.min(x, maxX));
  if (!Number.isFinite(y) || y < display.workArea.y) y = display.workArea.y + 24;

  win.setPosition(x, y, false);
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    positionWindow();
    win.show();
    win.focus();
  }
}

function createTray() {
  // macOS shows the title next to the (empty) image in the menu bar.
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle(' ⌨ ');
  tray.setToolTip('Keyboard Visualizer');

  tray.on('click', toggleWindow);
  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      { label: 'Toggle Window', click: toggleWindow },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.popUpContextMenu(menu);
  });
}

function startKeyHook() {
  const forward = (type) => (e) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('key', {
      type,
      keycode: e.keycode,
      rawcode: e.rawcode,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    });
  };
  uIOhook.on('keydown', forward('down'));
  uIOhook.on('keyup', forward('up'));
  try {
    uIOhook.start();
  } catch (err) {
    console.error('Failed to start uiohook:', err);
  }
}

app.on('window-all-closed', () => {
  // Stay alive in the tray; do not quit.
});

app.on('before-quit', () => {
  isQuitting = true;
  try {
    uIOhook.stop();
  } catch (_) {}
});

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  createWindow();
  createTray();
  startKeyHook();
});
