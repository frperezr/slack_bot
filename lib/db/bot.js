'use strict';

// node modules
const mongoose = require('mongoose');

// mongoose schema
const botSchema = new mongoose.Schema({
  name: { type: String },
  last_run: { type: String }
});

// Export Schema
module.exports = mongoose.model('BotModel', botSchema);
