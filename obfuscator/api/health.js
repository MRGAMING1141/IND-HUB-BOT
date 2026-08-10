module.exports = async function handler(req, res) {
  res.status(200).json({ ok: true, service: 'IND OBFUSCATOR API', timestamp: new Date().toISOString() });
};
