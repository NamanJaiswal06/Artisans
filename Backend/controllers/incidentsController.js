'use strict';
const { getBroker } = require('../services/incidentBroker');

exports.recentIncidents = async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    const topicPrefix = req.query.topic_prefix || null;
    const broker = getBroker();
    const messages = await broker.recentMessages(limit, topicPrefix);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
