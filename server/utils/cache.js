const NodeCache = require("node-cache");

// Global API Cache - Memory Based
// stdTTL: Standard time to live in seconds (1 hour default)
// checkperiod: How often to clear expired keys
const apiCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

module.exports = apiCache;
