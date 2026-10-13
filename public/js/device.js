// Phone or tablet versus desktop. The on-screen keyboard is only offered on desktops,
// since phones and tablets have their own language keyboards.
// For testing, ?device=desktop or ?device=mobile overrides detection for the tab.

function override() {
  try {
    const q = new URLSearchParams(location.search).get('device');
    if (q === 'desktop' || q === 'mobile') sessionStorage.setItem('langanki.device', q);
    return sessionStorage.getItem('langanki.device');
  } catch (e) {
    return null;
  }
}

export function isMobileDevice() {
  const forced = override();
  if (forced) return forced === 'mobile';
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true; // iPadOS reports as a Mac
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const fine = window.matchMedia?.('(any-pointer: fine)').matches;
  return !!coarse && !fine;
}

// Test hook: shift the clock to check scheduling across days.
export function now() {
  let offset = 0;
  try {
    offset = Number(sessionStorage.getItem('langanki.clockOffset')) || 0;
  } catch (e) {
    /* ignore */
  }
  return Date.now() + offset;
}
