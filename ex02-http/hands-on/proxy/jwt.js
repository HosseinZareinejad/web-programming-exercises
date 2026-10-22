'use strict';

const crypto = require('node:crypto');

const b64urlDecode = (s) => Buffer.from(s, 'base64url');
const b64urlEncode = (buf) => Buffer.from(buf).toString('base64url');

// Check a HS256 token. Returns the payload or throws an Error with a short reason.
function verifyToken(token, secret, now = Math.floor(Date.now() / 1000)) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, p, sig] = parts;

  let header, payload;
  try {
    header = JSON.parse(b64urlDecode(h).toString('utf8'));
    payload = JSON.parse(b64urlDecode(p).toString('utf8'));
  } catch {
    throw new Error('malformed token');
  }

  // Only accept the algorithm we expect. This blocks "alg: none" tricks.
  if (header.alg !== 'HS256') throw new Error('unsupported algorithm');

  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const given = b64urlDecode(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new Error('bad signature');
  }

  if (typeof payload.exp === 'number' && now >= payload.exp) throw new Error('token expired');
  if (typeof payload.nbf === 'number' && now < payload.nbf) throw new Error('token not active yet');
  return payload;
}

function signToken(payload, secret) {
  const h = b64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest();
  return `${h}.${p}.${b64urlEncode(sig)}`;
}

module.exports = { verifyToken, signToken };
