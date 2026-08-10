const crypto = require('crypto');

function safeName() {
  return `__IND_${crypto.randomBytes(5).toString('hex')}`;
}

function stripComments(source) {
  return source
    .replace(/--\[\[[\s\S]*?\]\]/g, '')
    .replace(/--[^\n\r]*/g, '');
}

function encodeStringLiteral(match, quote, body) {
  if (body.length === 0 || body.length > 256 || /[\\\r\n]/.test(body)) return match;
  const bytes = Buffer.from(body, 'utf8');
  return `string.char(${Array.from(bytes).join(',')})`;
}

function encodeStrings(source) {
  return source.replace(/(['"])(.*?)\1/g, encodeStringLiteral);
}

function addJunk(source, count) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    const n = safeName();
    blocks.push(`local ${n}=${i}*0`);
  }
  return `${blocks.join('\n')}\n${source}`;
}

function transform(source, level, options = {}) {
  let out = stripComments(source);
  const strength = { normal: 0, strong: 1, extreme: 2, max: 3 }[level] ?? 3;

  if (options.strings !== false) out = encodeStrings(out);
  if (options.junk !== false && strength > 0) out = addJunk(out, strength * 2);

  // Identifier renaming is intentionally conservative. A regex cannot safely
  // distinguish local variables from table keys, globals, or library names.
  // Keeping this pass conservative prevents breaking valid Luau programs.
  if (options.rename && strength >= 2) {
    out = out.replace(/\blocal\s+(__[A-Za-z0-9_]+)/g, (_, name) => `local ${safeName()}`);
  }

  if (options.integrity !== false) {
    const marker = crypto.createHash('sha256').update(source).digest('hex').slice(0, 16);
    out = `-- IND-INTEGRITY:${marker}\n${out}`;
  }

  return out.trim();
}

module.exports = { transform };
