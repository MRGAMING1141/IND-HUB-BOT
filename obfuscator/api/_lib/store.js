const crypto = require('crypto');

let memory = global.__IND_OBF_STORE;
if (!memory) memory = global.__IND_OBF_STORE = new Map();

const hasRedis = Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL) &&
  (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN)
);

async function redisCommand(command, ...args) {
  const base = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  const r = await fetch(`${base}/${[command, ...args].map(v => encodeURIComponent(v)).join('/')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  const data = await r.json();
  return data.result;
}

async function put(token, value, ttlSeconds) {
  if (hasRedis) {
    await redisCommand('set', token, JSON.stringify(value), 'EX', String(ttlSeconds));
    return;
  }
  memory.set(token, value);
  setTimeout(() => memory.delete(token), ttlSeconds * 1000).unref?.();
}

async function take(token) {
  if (hasRedis) {
    const raw = await redisCommand('get', token);
    if (!raw) return null;
    await redisCommand('del', token);
    return JSON.parse(raw);
  }
  const value = memory.get(token) || null;
  memory.delete(token);
  return value;
}

function token() {
  return crypto.randomBytes(24).toString('base64url');
}

module.exports = { put, take, token, hasRedis };
