// Pronunciation audio from the browser's built-in speech voices. If a device has no voice
// for a language, the play button is hidden for that language. Recorded clips can replace
// a language's voice later by adding them to RECORDINGS.

const RECORDINGS = {}; // lang -> { text: url }, filled in when recordings are added
const PREFERRED = [/premium/i, /enhanced/i, /google/i, /kyoko|otoya|haruka|nanami|keita/i];

let voices = [];
const ready = new Promise((resolve) => {
  if (!('speechSynthesis' in window)) return resolve();
  const load = () => {
    voices = window.speechSynthesis.getVoices();
    if (voices.length) resolve();
  };
  load();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    load();
    listeners.forEach((fn) => fn());
  });
  setTimeout(resolve, 2500);
});
const listeners = new Set();
export function onVoices(fn) {
  listeners.add(fn);
}
export const voicesReady = () => ready;

function voiceFor(lang) {
  const prefix = lang.slice(0, 2).toLowerCase();
  const matches = voices.filter((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(prefix));
  if (!matches.length) return null;
  for (const re of PREFERRED) {
    const v = matches.find((m) => re.test(m.name));
    if (v) return v;
  }
  return matches.find((m) => m.localService) || matches[0];
}

export function canSpeak(lang) {
  return !!RECORDINGS[lang] || !!voiceFor(lang);
}

let audio = null;
export function speak(text, lang, { rate = 0.8 } = {}) {
  const clip = RECORDINGS[lang]?.[text];
  if (clip) {
    audio?.pause();
    audio = new Audio(clip);
    audio.play().catch(() => {});
    return;
  }
  const voice = voiceFor(lang);
  if (!voice) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  synth.speak(u);
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
    audio?.pause();
  } catch (e) {
    /* ignore */
  }
}
