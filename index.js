'use strict';

// node modules
const Bot = require('./lib/slack_bot.js');
const env = require('dotenv').config();

// env settings
const token = process.env.BOT_API_KEY;
const dbPath = process.env.BOT_DB_PATH;
const name = process.env.BOT_NAME;

// declare a new bot
const slackBot = new Bot({ token, dbPath, name });

// run the bot
slackBot.run();
