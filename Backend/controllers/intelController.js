'use strict';
const { getIocStore } = require('../services/iocStore');

exports.loadIndicators = async (req, res) => {
  try {
    const rows = req.body.indicators;
    if (!Array.isArray(rows)) return res.json({ loaded: 0 });
    const n = await getIocStore().loadOtxStylePulse(rows);
    res.json({ loaded: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
