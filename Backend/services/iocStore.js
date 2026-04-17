'use strict';
/**
 * IOC Store — MongoDB-backed replacing Python in-memory IOCStore.
 */

const IOC = require('../models/IOC');

class IOCStore {
  /**
   * Load OTX-style pulse indicators: [{ type, indicator }, ...]
   * Returns count of newly inserted records.
   */
  async loadOtxStylePulse(rows) {
    let count = 0;
    for (const row of rows) {
      if (!row.type || !row.indicator) continue;
      try {
        await IOC.updateOne(
          { type: row.type, indicator: row.indicator },
          { $set: { source: row.source || 'otx', loadedAt: new Date() } },
          { upsert: true }
        );
        count++;
      } catch (_) { /* duplicate */ }
    }
    return count;
  }

  /**
   * Enrich a canonical event: return list of matching IOC strings.
   */
  async enrich(canonicalEvent) {
    const hits = [];
    const indicators = [
      canonicalEvent.src_ip,
      canonicalEvent.dst_ip,
      canonicalEvent.host,
      canonicalEvent.sender_email,
    ].filter(Boolean);

    for (const ind of indicators) {
      const found = await IOC.findOne({ indicator: ind });
      if (found) hits.push(`${found.type}:${found.indicator}`);
    }
    return hits;
  }
}

let _store = null;
function getIocStore() {
  if (!_store) _store = new IOCStore();
  return _store;
}

module.exports = { IOCStore, getIocStore };
