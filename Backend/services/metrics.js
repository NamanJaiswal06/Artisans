'use strict';
/**
 * Prometheus metrics — JS port of narip/observability/metrics.py
 * Uses prom-client.
 */

const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const moduleCounter = new client.Counter({
  name: 'narip_module_requests_total',
  help: 'Total detection module invocations',
  labelNames: ['module'],
  registers: [register],
});

const eventResult = new client.Counter({
  name: 'narip_event_results_total',
  help: 'Total events processed',
  labelNames: ['success'],
  registers: [register],
});

const latencyHist = new client.Histogram({
  name: 'narip_request_latency_seconds',
  help: 'Request latency in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

const ingestCounter = new client.Counter({
  name: 'narip_ingest_total',
  help: 'Total ingestion calls',
  labelNames: ['vendor', 'success'],
  registers: [register],
});

const Metrics = {
  module: (name) => moduleCounter.labels(name).inc(),
  eventResult: (success) => eventResult.labels(String(success)).inc(),
  observeLatency: (op, seconds) => latencyHist.labels(op).observe(seconds),
  ingest: (vendor, success) => ingestCounter.labels(vendor, String(success)).inc(),
  register,
};

module.exports = Metrics;
