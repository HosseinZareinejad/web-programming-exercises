'use strict';

const http = require('node:http');
const { verifyToken } = require('./jwt');

// Build the proxy server. It checks the JWT, then forwards the request to the upstream.
function createProxy({ upstream, secret }) {
  const target = new URL(upstream);

  return http.createServer((req, res) => {
    const auth = req.headers.authorization || '';
    const match = /^Bearer (.+)$/i.exec(auth);

    if (!match) return deny(res, 'missing bearer token');

    let claims;
    try {
      claims = verifyToken(match[1], secret);
    } catch (err) {
      return deny(res, err.message);
    }

    // The legacy service does not need the token, so we remove it
    // and tell the service who the user is with a normal header.
    const headers = { ...req.headers };
    delete headers.authorization;
    headers['x-authenticated-user'] = String(claims.sub ?? '');
    headers['x-forwarded-for'] = [req.headers['x-forwarded-for'], req.socket.remoteAddress]
      .filter(Boolean)
      .join(', ');

    const upstreamReq = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        method: req.method,
        path: req.url,
        headers,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
        upstreamRes.pipe(res);
      }
    );

    upstreamReq.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad gateway\n');
    });

    req.pipe(upstreamReq);
  });
}

function deny(res, reason) {
  res.writeHead(401, {
    'Content-Type': 'text/plain',
    'WWW-Authenticate': 'Bearer error="invalid_token"',
  });
  res.end(`Unauthorized: ${reason}\n`);
}

module.exports = { createProxy };

if (require.main === module) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set');
    process.exit(1);
  }
  const upstream = process.env.UPSTREAM_URL || 'http://httpbin:8081';
  const port = Number(process.env.PORT || 80);

  createProxy({ upstream, secret }).listen(port, () => {
    console.log(`proxy listening on :${port}, forwarding to ${upstream}`);
  });
}
