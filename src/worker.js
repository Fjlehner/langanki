// Sync service for LangAnki. Static files are served straight from ./public;
// only /api/* requests reach this code (see run_worker_first in wrangler.jsonc).
//
// A learner's code is a 10-character bearer key. The database stores only a SHA-256
// hash of it, so a leaked database cannot be used to open anyone's progress.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{10}$/;
const MAX_BODY = 512 * 1024;
const BAD_WINDOW_MS = 15 * 60 * 1000;
const BAD_LIMIT = 20; // wrong codes per IP per 15 minutes
const NEW_WINDOW_MS = 60 * 60 * 1000;
const NEW_LIMIT = 30; // new codes per IP per hour

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, url);
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error', message: 'Something went wrong on the server. Try again in a moment.' }, 500);
    }
  },
};

async function route(request, env, url) {
  const path = url.pathname;
  const method = request.method;
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const now = Date.now();

  if (path === '/api/health' && method === 'GET') return json({ ok: true });

  if (path === '/api/profiles' && method === 'POST') {
    if ((await getCount(env, 'new', ip, NEW_WINDOW_MS, now)) >= NEW_LIMIT) return tooMany();
    const data = await readData(request);
    if (data instanceof Response) return data;
    await bump(env, 'new', ip, NEW_WINDOW_MS, now);
    const code = newCode();
    const stamp = new Date(now).toISOString();
    await env.DB.prepare('INSERT INTO profiles (code_hash, data, version, created_at, updated_at) VALUES (?1, ?2, 1, ?3, ?3)')
      .bind(await hashCode(code), JSON.stringify(data), stamp)
      .run();
    if (Math.random() < 0.1) await env.DB.prepare('DELETE FROM limits WHERE expires < ?1').bind(now).run();
    return json({ code, version: 1 }, 201);
  }

  if (path === '/api/profile' || path === '/api/profile/rotate') {
    if ((await getCount(env, 'bad', ip, BAD_WINDOW_MS, now)) >= BAD_LIMIT) return tooMany();
    const code = normalizeCode(request.headers.get('X-LangAnki-Code') || '');
    const hash = CODE_RE.test(code) ? await hashCode(code) : null;
    const row = hash ? await env.DB.prepare('SELECT data, version FROM profiles WHERE code_hash = ?1').bind(hash).first() : null;
    if (!row) {
      await bump(env, 'bad', ip, BAD_WINDOW_MS, now);
      return json({ error: 'not_found', message: 'No progress is saved under that code. Check it and try again.' }, 404);
    }

    if (path === '/api/profile/rotate' && method === 'POST') {
      const fresh = newCode();
      await env.DB.prepare('UPDATE profiles SET code_hash = ?1, updated_at = ?2 WHERE code_hash = ?3')
        .bind(await hashCode(fresh), new Date(now).toISOString(), hash)
        .run();
      return json({ code: fresh, version: row.version });
    }
    if (path !== '/api/profile') return json({ error: 'not_found' }, 404);

    if (method === 'GET') return json({ data: JSON.parse(row.data), version: row.version });

    if (method === 'PUT') {
      const body = await readBody(request);
      if (body instanceof Response) return body;
      const { data, baseVersion } = body;
      if (!isObject(data) || !Number.isInteger(baseVersion)) return json({ error: 'bad_request', message: 'Expected data and baseVersion.' }, 400);
      // Only save on top of the version this device last saw; otherwise send back the newer copy to merge.
      const result = await env.DB.prepare('UPDATE profiles SET data = ?1, version = version + 1, updated_at = ?2 WHERE code_hash = ?3 AND version = ?4')
        .bind(JSON.stringify(data), new Date(now).toISOString(), hash, baseVersion)
        .run();
      if (result.meta.changes === 0) {
        const current = await env.DB.prepare('SELECT data, version FROM profiles WHERE code_hash = ?1').bind(hash).first();
        return json({ error: 'conflict', data: JSON.parse(current.data), version: current.version }, 409);
      }
      return json({ version: baseVersion + 1 });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM profiles WHERE code_hash = ?1').bind(hash).run();
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  return json({ error: 'not_found', message: 'Unknown request.' }, 404);
}

// ---------- helpers ----------

export function normalizeCode(input) {
  return String(input).toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map((b) => ALPHABET[b % 32]).join(''); // 256 is a multiple of 32, so no bias
}

async function hashCode(code) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`langanki:${code}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getCount(env, kind, ip, windowMs, now) {
  const key = `${kind}:${ip}:${Math.floor(now / windowMs)}`;
  const row = await env.DB.prepare('SELECT n FROM limits WHERE key = ?1').bind(key).first();
  return row ? row.n : 0;
}

async function bump(env, kind, ip, windowMs, now) {
  const w = Math.floor(now / windowMs);
  await env.DB.prepare('INSERT INTO limits (key, n, expires) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET n = n + 1')
    .bind(`${kind}:${ip}:${w}`, (w + 1) * windowMs)
    .run();
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'too_large', message: 'That progress file is too large to save.' }, 413);
  try {
    return JSON.parse(text);
  } catch {
    return json({ error: 'bad_request', message: 'Expected JSON.' }, 400);
  }
}

async function readData(request) {
  const body = await readBody(request);
  if (body instanceof Response) return body;
  if (!isObject(body.data)) return json({ error: 'bad_request', message: 'Expected data.' }, 400);
  return body.data;
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function tooMany() {
  return json({ error: 'rate_limited', message: 'Too many attempts from this network. Wait 15 minutes and try again.' }, 429);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
