'use strict';
/**
 * Lateral Movement & Exfiltration Detector — JS port of narip/detection/lateral.py
 * Python: GNN proxy + time-series anomaly (IsolationForest).
 * JS: graph density heuristic + isolation proxy.
 */

const { clamp01 } = require('../features/extraction');

function isolationScore(features) {
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const variance = features.reduce((s, f) => s + (f - mean) ** 2, 0) / features.length;
  return clamp01(mean * 0.6 + Math.sqrt(variance) * 0.4);
}

function gnnGraphProxy(flows) {
  if (!flows || flows.length === 0) return 0;
  // Build adjacency map and compute degree centrality
  const deg = {};
  for (const f of flows) {
    const src = f.src_ip || f.srcIp || '';
    const dst = f.dst_ip || f.dstIp || '';
    deg[src] = (deg[src] || 0) + 1;
    deg[dst] = (deg[dst] || 0) + 1;
  }
  const nodes = Object.keys(deg).length;
  const edges = flows.length;
  if (nodes === 0) return 0;
  const maxDeg = Math.max(...Object.values(deg));
  const maxCentrality = maxDeg / Math.max(nodes - 1, 1);
  return Math.min(1, (edges / (nodes + 1e-6)) * maxCentrality * 2);
}

class LateralMovementDetector {
  constructor() {
    this._modelsUsed = ['gnn_graph_analysis', 'time_series_anomaly'];
  }

  /**
   * @param {number[]} features [total_bytes_n, unique_dst_n, priv_ports_n]
   * @param {object[]} flows    NetworkFlowEvents
   */
  score(features, flows = []) {
    const ts = isolationScore(features);
    const gnnRisk = gnnGraphProxy(flows);
    const breach = clamp01(0.55 * ts + 0.45 * gnnRisk);
    const totalOut = flows.reduce((a, f) => a + (f.bytes_out || f.bytesOut || 0), 0);
    const exfilRate = Math.max(0, totalOut / 60); // bytes/sec assuming 1-min window

    return {
      breach_likelihood: breach,
      exfiltration_rate_estimate_bytes_per_sec: exfilRate,
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { LateralMovementDetector };
