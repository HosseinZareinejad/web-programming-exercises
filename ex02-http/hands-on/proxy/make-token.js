'use strict';

// Usage: JWT_SECRET=... node make-token.js [username] [seconds-valid]
const { signToken } = require('./jwt');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const sub = process.argv[2] || 'student';
const seconds = Number(process.argv[3] || 3600);
const now = Math.floor(Date.now() / 1000);

console.log(signToken({ sub, iat: now, exp: now + seconds }, secret));
