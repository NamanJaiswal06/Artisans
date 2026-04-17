'use strict';
/**
 * Incident Broker — MongoDB-backed pub/sub replacing Python in-memory IncidentBroker.
 */

const PubSubIncident = require('../models/Incident');

class IncidentBroker {
  /**
   * Publish a message to a topic and persist it in MongoDB.
   */
  async publish(topic, payload) {
    await PubSubIncident.create({
      type: topic,
      content: JSON.stringify(payload),
      source: 'narip',
      status: 'Pending',
      threatLevel: payload.risk >= 80 ? 'Critical' : payload.risk >= 60 ? 'High' : 'Medium',
      confidence: payload.risk || 0,
      reason: `Automated publish: ${topic}`,
    });
  }

  /**
   * Retrieve recent messages, optionally filtered by topic prefix.
   */
  async recentMessages(limit = 50, topicPrefix = null) {
    const query = topicPrefix ? { type: { $regex: `^${topicPrefix}` } } : {};
    const docs = await PubSubIncident.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(d => ({
      topic: d.type,
      payload: (() => { try { return JSON.parse(d.content); } catch { return d.content; } })(),
      publishedAt: d.createdAt,
    }));
  }
}

let _broker = null;
function getBroker() {
  if (!_broker) _broker = new IncidentBroker();
  return _broker;
}

module.exports = { IncidentBroker, getBroker };
