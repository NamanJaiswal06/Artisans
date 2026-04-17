'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { dbConnect } = require('./config/database');
const Metrics = require('./services/metrics');


const app = express();

// ── Connect DB ────────────────────────────────────────────────────
dbConnect();

// ── Global Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, origin || '*'),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'narip', version: '1.0.0', api: 'rest' });
});

// ── Prometheus Metrics ────────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', Metrics.register.contentType);
  res.end(await Metrics.register.metrics());
});

// ── Auth Routes ───────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));

// ── NARIP API Routes ──────────────────────────────────────────────
app.use('/api/v1/detect',       require('./routes/detect'));
app.use('/api/v1/risk',         require('./routes/risk'));
app.use('/api/v1/incidents',    require('./routes/incidents'));
app.use('/api/v1/automation',   require('./routes/automation'));
app.use('/api/v1/ingest',       require('./routes/ingest'));
app.use('/api/v1/threat-intel', require('./routes/intel'));
app.use('/api/v1/integrations', require('./routes/integrations'));
app.use('/api/v1/workforce',    require('./routes/workforce'));
app.use('/api/v1',        require('./routes/store')); 

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ── Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 NARIP server running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Metrics: http://localhost:${PORT}/metrics`);
  console.log(`   Docs:    All routes at /v1/detect, /v1/risk, /v1/workforce ...`);
});