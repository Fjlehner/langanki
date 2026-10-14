// QR codes for opening LangAnki on a phone. The generator loads only when a code is shown.

let lib = null;

// An SVG QR code for `text`, drawn with currentColor on a light square.
export async function qrSVG(text, { label = 'QR code' } = {}) {
  lib ||= (await import('./vendor/qrcode.js')).default;
  const qr = lib(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = 4; // quiet zone
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  const size = n + q * 2;
  return `<svg class="qr__svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

// Fill every [data-qr] placeholder on the page.
export async function fillQRs(root) {
  for (const el of root.querySelectorAll('[data-qr]')) {
    try {
      el.innerHTML = await qrSVG(el.dataset.qr, { label: el.dataset.qrLabel || 'QR code' });
    } catch (e) {
      el.closest('.qr')?.remove();
    }
  }
}
