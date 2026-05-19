// ---- 60% ANSI layout ----------------------------------------------------
// `size` is in keyboard units (U). Total per row should equal 15U.
const layout = [
  [
    { id: 'Backquote', label: '`', sub: '~' },
    { id: 'Digit1', label: '1', sub: '!' },
    { id: 'Digit2', label: '2', sub: '@' },
    { id: 'Digit3', label: '3', sub: '#' },
    { id: 'Digit4', label: '4', sub: '$' },
    { id: 'Digit5', label: '5', sub: '%' },
    { id: 'Digit6', label: '6', sub: '^' },
    { id: 'Digit7', label: '7', sub: '&' },
    { id: 'Digit8', label: '8', sub: '*' },
    { id: 'Digit9', label: '9', sub: '(' },
    { id: 'Digit0', label: '0', sub: ')' },
    { id: 'Minus', label: '-', sub: '_' },
    { id: 'Equal', label: '=', sub: '+' },
    { id: 'Backspace', label: 'delete', size: 2, accent: 'red', wide: true },
  ],
  [
    { id: 'Tab', label: 'tab', size: 1.5, accent: 'yellow', wide: true },
    { id: 'KeyQ', label: 'Q' },
    { id: 'KeyW', label: 'W' },
    { id: 'KeyE', label: 'E' },
    { id: 'KeyR', label: 'R' },
    { id: 'KeyT', label: 'T' },
    { id: 'KeyY', label: 'Y' },
    { id: 'KeyU', label: 'U' },
    { id: 'KeyI', label: 'I' },
    { id: 'KeyO', label: 'O' },
    { id: 'KeyP', label: 'P' },
    { id: 'BracketLeft', label: '[', sub: '{' },
    { id: 'BracketRight', label: ']', sub: '}' },
    { id: 'Backslash', label: '\\', sub: '|', size: 1.5 },
  ],
  [
    { id: 'CapsLock', label: 'caps', size: 1.75, accent: 'yellow', wide: true },
    { id: 'KeyA', label: 'A', sticker: 'star' },
    { id: 'KeyS', label: 'S' },
    { id: 'KeyD', label: 'D' },
    { id: 'KeyF', label: 'F' },
    { id: 'KeyG', label: 'G' },
    { id: 'KeyH', label: 'H' },
    { id: 'KeyJ', label: 'J' },
    { id: 'KeyK', label: 'K', sticker: 'heart' },
    { id: 'KeyL', label: 'L' },
    { id: 'Semicolon', label: ';', sub: ':' },
    { id: 'Quote', label: "'", sub: '"' },
    { id: 'Enter', label: 'return', size: 2.25, accent: 'red', wide: true },
  ],
  [
    { id: 'ShiftLeft', label: 'shift', size: 2.25, accent: 'yellow', wide: true },
    { id: 'KeyZ', label: 'Z' },
    { id: 'KeyX', label: 'X' },
    { id: 'KeyC', label: 'C' },
    { id: 'KeyV', label: 'V' },
    { id: 'KeyB', label: 'B', sticker: 'heart' },
    { id: 'KeyN', label: 'N' },
    { id: 'KeyM', label: 'M' },
    { id: 'Comma', label: ',', sub: '<' },
    { id: 'Period', label: '.', sub: '>' },
    { id: 'Slash', label: '/', sub: '?' },
    { id: 'ShiftRight', label: 'shift', size: 2.75, accent: 'yellow', wide: true },
  ],
  [
    { id: 'ControlLeft', label: 'ctrl', size: 1.25, accent: 'yellow', wide: true },
    { id: 'AltLeft', label: 'opt', size: 1.25, accent: 'yellow', wide: true },
    { id: 'MetaLeft', label: 'cmd', size: 1.25, accent: 'yellow', wide: true, sticker: 'star' },
    { id: 'Space', label: '', size: 6.25, space: true },
    { id: 'MetaRight', label: 'cmd', size: 1.25, accent: 'yellow', wide: true },
    { id: 'AltRight', label: 'opt', size: 1.25, accent: 'yellow', wide: true },
    { id: 'Fn', label: 'fn', size: 1.25, accent: 'yellow', wide: true },
    { id: 'ControlRight', label: 'ctrl', size: 1.25, accent: 'yellow', wide: true },
  ],
];

// ---- uiohook scancode -> keycap id --------------------------------------
const uioToId = {
  0x29: 'Backquote',
  0x02: 'Digit1', 0x03: 'Digit2', 0x04: 'Digit3', 0x05: 'Digit4', 0x06: 'Digit5',
  0x07: 'Digit6', 0x08: 'Digit7', 0x09: 'Digit8', 0x0a: 'Digit9', 0x0b: 'Digit0',
  0x0c: 'Minus', 0x0d: 'Equal',
  0x0e: 'Backspace',
  0x0f: 'Tab',
  0x10: 'KeyQ', 0x11: 'KeyW', 0x12: 'KeyE', 0x13: 'KeyR', 0x14: 'KeyT',
  0x15: 'KeyY', 0x16: 'KeyU', 0x17: 'KeyI', 0x18: 'KeyO', 0x19: 'KeyP',
  0x1a: 'BracketLeft', 0x1b: 'BracketRight', 0x2b: 'Backslash',
  0x3a: 'CapsLock',
  0x1e: 'KeyA', 0x1f: 'KeyS', 0x20: 'KeyD', 0x21: 'KeyF', 0x22: 'KeyG',
  0x23: 'KeyH', 0x24: 'KeyJ', 0x25: 'KeyK', 0x26: 'KeyL',
  0x27: 'Semicolon', 0x28: 'Quote',
  0x1c: 'Enter',
  0x2a: 'ShiftLeft',
  0x2c: 'KeyZ', 0x2d: 'KeyX', 0x2e: 'KeyC', 0x2f: 'KeyV', 0x30: 'KeyB',
  0x31: 'KeyN', 0x32: 'KeyM',
  0x33: 'Comma', 0x34: 'Period', 0x35: 'Slash',
  0x36: 'ShiftRight',
  0x1d: 'ControlLeft', 0xe01d: 'ControlRight',
  0x38: 'AltLeft', 0xe038: 'AltRight',
  0xe05b: 'MetaLeft', 0xe05c: 'MetaRight',
  0x39: 'Space',
};

// ---- inline-SVG stickers -------------------------------------------------
const STAR_SVG =
  '<svg viewBox="0 0 20 20"><path d="M10 1 12 7 18 7 13 11 15 17 10 13 5 17 7 11 2 7 8 7Z"/></svg>';
const HEART_SVG =
  '<svg viewBox="0 0 20 20"><path d="M10 17 C 3 12 1 8 4 5 C 6.5 2.6 9 4 10 6 C 11 4 13.5 2.6 16 5 C 19 8 17 12 10 17 Z"/></svg>';

// ---- DOM construction ----------------------------------------------------
function buildKeyboard() {
  const root = document.getElementById('keyboard');
  layout.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    row.forEach((key) => {
      const k = document.createElement('div');
      k.className = 'key';
      k.dataset.key = key.id;
      if (key.accent) k.classList.add('accent-' + key.accent);
      if (key.wide) k.classList.add('wide');
      if (key.space) k.classList.add('space');
      k.style.flexGrow = String(key.size || 1);
      k.style.flexBasis = '0';

      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = key.sub || '';
      const top = document.createElement('span');
      top.className = 'top';
      top.textContent = key.label;
      k.append(sub, top);

      if (key.sticker === 'star' || key.sticker === 'heart') {
        const wrap = document.createElement('span');
        wrap.className = 'sticker ' + key.sticker;
        wrap.innerHTML = key.sticker === 'star' ? STAR_SVG : HEART_SVG;
        k.appendChild(wrap);
      }
      rowEl.appendChild(k);
    });
    root.appendChild(rowEl);
  });
}

// ---- Web Audio engine ----------------------------------------------------
class KeyAudio {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this.mode = 'synth1';
    this.samples = {};
    this.noiseBuffer = this._makeNoiseBuffer();
  }

  async loadSamples() {
    if (!window.keyboard || !window.keyboard.loadSamples) return;
    const files = window.keyboard.loadSamples();
    for (let i = 0; i < files.length; i++) {
      const slot = 'sample' + (i + 1);
      try {
        // decodeAudioData consumes the buffer — pass a copy so we keep options open.
        const ab = files[i].data.slice(0);
        const buf = await this.ctx.decodeAudioData(ab);
        this.samples[slot] = buf;
      } catch (err) {
        console.warn('decode failed for', files[i].name, err);
      }
    }
    this._reflectSampleAvailability();
  }

  _reflectSampleAvailability() {
    document.querySelectorAll('[data-mode]').forEach((btn) => {
      const m = btn.dataset.mode;
      if (m === 'sample1' || m === 'sample2') {
        const ok = !!this.samples[m];
        btn.classList.toggle('disabled', !ok);
        btn.title = ok ? '' : 'Drop a .wav / .mp3 in uploads/ and restart';
      }
    });
  }

  _makeNoiseBuffer() {
    const len = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  ensureRunning() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // synth 1: oscillator sweep — short, crisp click
  _playClick() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1900 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.035);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // synth 2: band-passed noise — softer "fuzz" thock
  _playFuzz() {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800 + Math.random() * 600;
    bp.Q.value = 1.4;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(bp).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + 0.07);
  }

  _playSample(slot) {
    const buf = this.samples[slot];
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.97 + Math.random() * 0.06;
    src.connect(this.master);
    src.start();
  }

  play() {
    this.ensureRunning();
    switch (this.mode) {
      case 'synth1':
        return this._playClick();
      case 'synth2':
        return this._playFuzz();
      case 'sample1':
        return this._playSample('sample1');
      case 'sample2':
        return this._playSample('sample2');
    }
  }
}

// ---- wiring --------------------------------------------------------------
const audio = new KeyAudio();

function setMode(m) {
  audio.mode = m;
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === m);
  });
}

function pressKey(id) {
  const el = document.querySelector(`[data-key="${id}"]`);
  if (!el) return;
  el.classList.add('pressed');
  audio.play();
}

function releaseKey(id) {
  const el = document.querySelector(`[data-key="${id}"]`);
  if (!el) return;
  el.classList.remove('pressed');
}

window.addEventListener('DOMContentLoaded', async () => {
  buildKeyboard();
  await audio.loadSamples();

  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.ensureRunning();
      setMode(btn.dataset.mode);
      // Audible feedback on switch.
      audio.play();
    });
  });

  if (window.keyboard && window.keyboard.onKey) {
    window.keyboard.onKey((evt) => {
      const id = uioToId[evt.keycode];
      if (!id) return;
      if (evt.type === 'down') {
        // uiohook fires keydown repeatedly while held — guard so we
        // don't re-trigger sound on auto-repeat.
        const el = document.querySelector(`[data-key="${id}"]`);
        if (el && el.classList.contains('pressed')) return;
        pressKey(id);
      } else if (evt.type === 'up') {
        releaseKey(id);
      }
    });
  }
});
