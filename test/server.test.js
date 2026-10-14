const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');

const EXPECTED_STATUS = 200;

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  });
}

test('GET /health reports ok', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.strictEqual(response.status, EXPECTED_STATUS);
    const body = await response.json();
    assert.strictEqual(body.status, 'ok');
  } finally {
    await stopServer(server);
  }
});

test('GET / returns a version and hostname', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const body = await response.json();
    assert.ok(body.version);
    assert.ok(body.hostname);
  } finally {
    await stopServer(server);
  }
});

test('GET /metrics exposes Prometheus metrics', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    await fetch(`http://127.0.0.1:${port}/health`);
    const response = await fetch(`http://127.0.0.1:${port}/metrics`);
    const text = await response.text();
    assert.strictEqual(response.status, 200);
    assert.match(text, /http_requests_total/);
    assert.match(text, /http_request_duration_seconds_bucket/);
  } finally {
    await stopServer(server);
  }
});
