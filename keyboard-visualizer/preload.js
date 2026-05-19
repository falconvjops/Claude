const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

function readSamplesSync() {
  const dir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(wav|mp3)$/i.test(f))
    .sort()
    .slice(0, 2);
  return files.map((name) => {
    const buf = fs.readFileSync(path.join(dir, name));
    // Hand off as a real ArrayBuffer so the renderer can decodeAudioData it.
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return { name, data: ab };
  });
}

contextBridge.exposeInMainWorld('keyboard', {
  onKey: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('key', handler);
    return () => ipcRenderer.removeListener('key', handler);
  },
  loadSamples: () => {
    try {
      return readSamplesSync();
    } catch (err) {
      console.warn('loadSamples failed', err);
      return [];
    }
  },
});
