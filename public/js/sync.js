// Saving progress under a short code, so a learner can continue on another device.
// The code lives in this browser's storage; the server keeps one copy of the progress per code.

const CODE_KEY = 'langanki.code';
const VERSION_KEY = 'langanki.syncVersion';
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{10}$/;
const MAX_LOG = 2000;

export function normalizeCode(input) {
  return String(input || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}
export function isValidCode(code) {
  return CODE_RE.test(code);
}
export function formatCode(code) {
  return code ? `${code.slice(0, 5)}-${code.slice(5)}` : '';
}
export function restoreLink(code) {
  return `${location.origin}/#code=${formatCode(code)}`;
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch (e) {
    /* storage blocked */
  }
}

let memCode = read(CODE_KEY);
let memVersion = Number(read(VERSION_KEY)) || 0;

export function getCode() {
  return memCode;
}
function setCode(code, version) {
  memCode = code;
  memVersion = version;
  write(CODE_KEY, code);
  write(VERSION_KEY, version);
}
function setVersion(v) {
  memVersion = v;
  write(VERSION_KEY, v);
}
export function forgetCode() {
  setCode(null, null);
}

// ---------- status for the page footer ----------

let status = memCode ? 'saved' : 'none'; // none | saving | saved | offline | error
const listeners = new Set();
export function onStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getStatus() {
  return status;
}
function setStatus(s) {
  status = s;
  listeners.forEach((fn) => fn(s));
}

// ---------- server calls ----------

export class SyncError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function call(method, path, { body, code } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(code ? { 'X-LangAnki-Code': code } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    throw new SyncError('Couldn’t reach the server. Check your connection and try again.', 0);
  }
  let data = null;
  try {
    data = res.status === 204 ? null : await res.json();
  } catch (e) {
    /* not JSON */
  }
  if (!res.ok && res.status !== 409) throw new SyncError(data?.message || `The server answered with an error (${res.status}).`, res.status);
  return { status: res.status, data };
}

let available = null;
export async function apiAvailable() {
  if (available !== null) return available;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('/api/health', { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    available = res.ok && (await res.json()).ok === true;
  } catch (e) {
    available = false;
  }
  return available;
}

export async function createProfile(state) {
  const { data } = await call('POST', '/api/profiles', { body: { data: state } });
  setCode(data.code, data.version);
  setStatus('saved');
  return data.code;
}

// Fetch the progress saved under a code (used to restore on a new device).
export async function fetchProfile(code) {
  const { data } = await call('GET', '/api/profile', { code });
  return data;
}

export function adoptCode(code, version) {
  setCode(code, version);
  setStatus('saved');
}

// Bring in changes made on another device.
export async function pull(state) {
  if (!memCode) return state;
  try {
    const { data } = await call('GET', '/api/profile', { code: memCode });
    if (data.version === memVersion) {
      setStatus('saved');
      return state;
    }
    const merged = mergeStates(state, data.data);
    setVersion(data.version);
    return merged;
  } catch (e) {
    setStatus(e.status === 0 ? 'offline' : 'error');
    if (e.status === 404) forgetCode();
    return state;
  }
}

// Save this device's progress. Returns the state to keep (merged if another device saved first).
export async function push(state) {
  if (!memCode) return state;
  setStatus('saving');
  try {
    let current = state;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { status: code, data } = await call('PUT', '/api/profile', { code: memCode, body: { data: current, baseVersion: memVersion } });
      if (code !== 409) {
        setVersion(data.version);
        setStatus('saved');
        return current;
      }
      current = mergeStates(current, data.data);
      setVersion(data.version);
    }
    setStatus('error');
    return current;
  } catch (e) {
    setStatus(e.status === 0 ? 'offline' : 'error');
    if (e.status === 404) forgetCode();
    return state;
  }
}

export async function rotateCode() {
  const { data } = await call('POST', '/api/profile/rotate', { code: memCode });
  setCode(data.code, data.version);
  setStatus('saved');
  return data.code;
}

export async function eraseRemote() {
  if (!memCode) return;
  await call('DELETE', '/api/profile', { code: memCode });
  forgetCode();
  setStatus('none');
}

// ---------- merging two copies of the same learner's progress ----------

// Each card keeps whichever copy was reviewed most recently; counts and logs are combined.
export function mergeStates(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const out = { ...remote, ...local };
  out.createdAt = [local.createdAt, remote.createdAt].filter(Boolean).sort()[0];
  out.codeSaved = !!(local.codeSaved || remote.codeSaved);
  out.settings = { ...(remote.settings || {}), ...(local.settings || {}) };

  out.cards = {};
  for (const id of new Set([...Object.keys(local.cards || {}), ...Object.keys(remote.cards || {})])) {
    const a = local.cards?.[id];
    const b = remote.cards?.[id];
    if (!a || !b) out.cards[id] = a || b;
    else if ((a.last || 0) !== (b.last || 0)) out.cards[id] = (a.last || 0) > (b.last || 0) ? a : b;
    else out.cards[id] = (a.reps || 0) >= (b.reps || 0) ? a : b;
  }

  out.daily = {};
  for (const day of new Set([...Object.keys(local.daily || {}), ...Object.keys(remote.daily || {})])) {
    const a = local.daily?.[day] || {};
    const b = remote.daily?.[day] || {};
    const merged = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) merged[k] = Math.max(a[k] || 0, b[k] || 0);
    out.daily[day] = merged;
  }

  const seen = new Map();
  for (const e of [...(remote.log || []), ...(local.log || [])]) seen.set(`${e.at}|${e.id}`, e);
  out.log = [...seen.values()].sort((x, y) => x.at - y.at).slice(-MAX_LOG);
  return out;
}
