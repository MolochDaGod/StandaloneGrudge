let audioCtx = null;
let bgmGain = null;
let sfxGain = null;
let currentBgm = null;
let bgmNodes = [];

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = musicMuted ? 0 : musicVolume;
    bgmGain.connect(audioCtx.destination);
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = sfxMuted ? 0 : sfxVolume;
    sfxGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playNote(freq, duration, type = 'sine', gainNode = sfxGain, volume = 0.3, delay = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  g.gain.setValueAtTime(volume, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(g);
  g.connect(gainNode);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
  return osc;
}

function playNoise(duration, gainNode = sfxGain, volume = 0.1, delay = 0) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(volume, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  source.connect(filter);
  filter.connect(g);
  g.connect(gainNode);
  source.start(ctx.currentTime + delay);
}

export function playSwordHit() {
  playNoise(0.15, sfxGain, 0.15);
  playNote(200, 0.1, 'sawtooth', sfxGain, 0.15);
  playNote(120, 0.15, 'sawtooth', sfxGain, 0.1, 0.05);
}

export function playMagicCast() {
  playNote(400, 0.3, 'sine', sfxGain, 0.15);
  playNote(600, 0.25, 'sine', sfxGain, 0.12, 0.1);
  playNote(800, 0.2, 'sine', sfxGain, 0.08, 0.2);
  playNote(1000, 0.3, 'triangle', sfxGain, 0.06, 0.25);
}

export function playHeal() {
  playNote(523, 0.2, 'sine', sfxGain, 0.12);
  playNote(659, 0.2, 'sine', sfxGain, 0.12, 0.1);
  playNote(784, 0.3, 'sine', sfxGain, 0.12, 0.2);
  playNote(1047, 0.4, 'triangle', sfxGain, 0.08, 0.3);
}

export function playBuff() {
  playNote(330, 0.15, 'triangle', sfxGain, 0.1);
  playNote(440, 0.15, 'triangle', sfxGain, 0.1, 0.1);
  playNote(550, 0.2, 'triangle', sfxGain, 0.1, 0.2);
}

export function playHurt() {
  playNote(150, 0.12, 'sawtooth', sfxGain, 0.12);
  playNote(100, 0.15, 'sawtooth', sfxGain, 0.1, 0.05);
  playNoise(0.1, sfxGain, 0.08, 0.02);
}

export function playCrit() {
  playNoise(0.08, sfxGain, 0.12);
  playNote(250, 0.08, 'sawtooth', sfxGain, 0.15);
  playNote(500, 0.15, 'sawtooth', sfxGain, 0.12, 0.05);
  playNote(180, 0.2, 'sawtooth', sfxGain, 0.1, 0.1);
}

export function playDodge() {
  playNote(800, 0.08, 'sine', sfxGain, 0.08);
  playNote(600, 0.1, 'sine', sfxGain, 0.06, 0.05);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => playNote(n, 0.3, 'triangle', sfxGain, 0.12, i * 0.15));
}

export function playDefeat() {
  const notes = [400, 350, 300, 200];
  notes.forEach((n, i) => playNote(n, 0.4, 'sawtooth', sfxGain, 0.08, i * 0.2));
}

export function playClick() {
  playNote(600, 0.05, 'sine', sfxGain, 0.06);
}

function stopBgm() {
  bgmNodes.forEach(n => {
    try { n.stop(); } catch(e) {}
  });
  bgmNodes = [];
  currentBgm = null;
}

function createDrone(freq, type, vol) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = vol;
  osc.connect(g);
  g.connect(bgmGain);
  osc.start();
  bgmNodes.push(osc);
  return { osc, gain: g };
}

function startAmbientMusic() {
  if (currentBgm === 'ambient') return;
  stopBgm();
  currentBgm = 'ambient';

  createDrone(65, 'sine', 0.08);
  createDrone(98, 'sine', 0.05);
  createDrone(130, 'triangle', 0.03);

  const ctx = getCtx();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(bgmGain);
  lfo.start();
  bgmNodes.push(lfo);

  const melodyNotes = [196, 220, 247, 262, 294, 262, 247, 220];
  let melodyIdx = 0;
  const melodyInterval = setInterval(() => {
    if (currentBgm !== 'ambient') { clearInterval(melodyInterval); return; }
    const ctx2 = getCtx();
    const osc = ctx2.createOscillator();
    const g = ctx2.createGain();
    osc.type = 'sine';
    osc.frequency.value = melodyNotes[melodyIdx % melodyNotes.length];
    g.gain.setValueAtTime(0.03, ctx2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 2);
    osc.connect(g);
    g.connect(bgmGain);
    osc.start();
    osc.stop(ctx2.currentTime + 2.1);
    melodyIdx++;
  }, 3000);
  bgmNodes._melodyInterval = melodyInterval;
}

function startBattleMusic() {
  if (currentBgm === 'battle') return;
  stopBgm();
  currentBgm = 'battle';

  createDrone(55, 'sawtooth', 0.04);
  createDrone(82, 'square', 0.02);
  createDrone(110, 'sawtooth', 0.03);

  const ctx = getCtx();
  let beatCount = 0;
  const beatInterval = setInterval(() => {
    if (currentBgm !== 'battle') { clearInterval(beatInterval); return; }
    const ctx2 = getCtx();
    const osc = ctx2.createOscillator();
    const g = ctx2.createGain();
    osc.type = beatCount % 4 === 0 ? 'square' : 'sawtooth';
    osc.frequency.value = beatCount % 4 === 0 ? 55 : 44;
    g.gain.setValueAtTime(0.06, ctx2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.2);
    osc.connect(g);
    g.connect(bgmGain);
    osc.start();
    osc.stop(ctx2.currentTime + 0.25);

    if (beatCount % 8 === 0) {
      const tensionNotes = [165, 196, 220, 165];
      tensionNotes.forEach((n, i) => {
        const o = ctx2.createOscillator();
        const gg = ctx2.createGain();
        o.type = 'triangle';
        o.frequency.value = n;
        gg.gain.setValueAtTime(0.025, ctx2.currentTime + i * 0.15);
        gg.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + i * 0.15 + 0.4);
        o.connect(gg);
        gg.connect(bgmGain);
        o.start(ctx2.currentTime + i * 0.15);
        o.stop(ctx2.currentTime + i * 0.15 + 0.45);
      });
    }
    beatCount++;
  }, 400);
  bgmNodes._beatInterval = beatInterval;
}

export function setBgm(type) {
  if (type === 'battle') startBattleMusic();
  else if (type === 'ambient') startAmbientMusic();
  else stopBgm();
}

export function initAudio() {
  getCtx();
}

let musicMuted = false;
let sfxMuted = false;
let musicVolume = 0.15;
let sfxVolume = 0.25;

export function setMusicMuted(muted) {
  musicMuted = muted;
  if (bgmGain) bgmGain.gain.value = muted ? 0 : musicVolume;
}

export function setSfxMuted(muted) {
  sfxMuted = muted;
  if (sfxGain) sfxGain.gain.value = muted ? 0 : sfxVolume;
}

export function setMusicVolume(vol) {
  musicVolume = vol;
  if (bgmGain && !musicMuted) bgmGain.gain.value = vol;
}

export function setSfxVolume(vol) {
  sfxVolume = vol;
  if (sfxGain && !sfxMuted) sfxGain.gain.value = vol;
}

export function getMusicMuted() { return musicMuted; }
export function getSfxMuted() { return sfxMuted; }
export function getMusicVolume() { return musicVolume; }
export function getSfxVolume() { return sfxVolume; }

let userInteracted = false;
function handleFirstInteraction() {
  if (userInteracted) return;
  userInteracted = true;
  getCtx();
  window.removeEventListener('click', handleFirstInteraction);
  window.removeEventListener('keydown', handleFirstInteraction);
}
window.addEventListener('click', handleFirstInteraction);
window.addEventListener('keydown', handleFirstInteraction);
