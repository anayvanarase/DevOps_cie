const os = require('os');
const express = require('express');
const client = require('prom-client');
const pkg = require('./package.json');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const VERSION = process.env.APP_VERSION || pkg.version;
const GREETING = process.env.GREETING || 'Hello from the DevOps demo application';

if (process.env.FAIL_ON_START === 'true') {
  console.error('FATAL: FAIL_ON_START is set, simulating a startup failure');
  process.exit(1);
}

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

const app = express();

app.use((req, res, next) => {
  const stopTimer = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : 'unmatched';
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    stopTimer(labels);
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: GREETING, version: VERSION, hostname: os.hostname() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/slow', (req, res) => {
  const delayMs = 200 + Math.floor(Math.random() * 1300);
  setTimeout(() => res.json({ delayMs }), delayMs);
});

app.get('/error', (req, res) => {
  res.status(500).json({ error: 'simulated server error' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`demo-app ${VERSION} listening on ${HOST}:${PORT}`);
  });
}

module.exports = app;
