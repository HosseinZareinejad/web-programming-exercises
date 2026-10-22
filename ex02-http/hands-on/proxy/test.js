'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createProxy } = require('./server');
const { signToken } = require('./jwt');

const SECRET = 'test-secret';
const now = () => Math.floor(Date.now() / 1000);

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function get(port, headers = {}, path = '/hello') {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path, headers }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });
}

test('proxy', async (t) => {
  // A fake internal service that shows what it received.
  const seen = [];
  const service = http.createServer((req, res) => {
    seen.push(req.headers);
    res.end(JSON.stringify({ path: req.url, user: req.headers['x-authenticated-user'] }));
  });
  const servicePort = await listen(service);

  const proxy = createProxy({ upstream: `http://127.0.0.1:${servicePort}`, secret: SECRET });
  const proxyPort = await listen(proxy);

  t.after(() => {
    proxy.close();
    service.close();
  });

  await t.test('rejects a request without a token', async () => {
    const r = await get(proxyPort);
    assert.strictEqual(r.status, 401);
  });

  await t.test('rejects a token with a wrong signature', async () => {
    const token = signToken({ sub: 'ali', exp: now() + 60 }, 'other-secret');
    const r = await get(proxyPort, { Authorization: `Bearer ${token}` });
    assert.strictEqual(r.status, 401);
  });

  await t.test('rejects an expired token', async () => {
    const token = signToken({ sub: 'ali', exp: now() - 10 }, SECRET);
    const r = await get(proxyPort, { Authorization: `Bearer ${token}` });
    assert.strictEqual(r.status, 401);
  });

  await t.test('rejects alg none', async () => {
    const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const p = Buffer.from(JSON.stringify({ sub: 'ali' })).toString('base64url');
    const r = await get(proxyPort, { Authorization: `Bearer ${h}.${p}.` });
    assert.strictEqual(r.status, 401);
  });

  await t.test('forwards a valid request and hides the token from the service', async () => {
    const token = signToken({ sub: 'ali', exp: now() + 60 }, SECRET);
    const r = await get(proxyPort, { Authorization: `Bearer ${token}` }, '/anything?x=1');
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(JSON.parse(r.body), { path: '/anything?x=1', user: 'ali' });
    assert.strictEqual(seen.at(-1).authorization, undefined);
  });

  await t.test('returns 502 when the service is down', async () => {
    const dead = createProxy({ upstream: 'http://127.0.0.1:1', secret: SECRET });
    const deadPort = await listen(dead);
    const token = signToken({ sub: 'ali', exp: now() + 60 }, SECRET);
    const r = await get(deadPort, { Authorization: `Bearer ${token}` });
    dead.close();
    assert.strictEqual(r.status, 502);
  });
});
