'use strict';

// node modules
const axios = require('axios');
const mongoose = require('mongoose');
const Bot = require('slackbots');

// model help handler
const BotModel = require('./db/bot');

// SlackBot class
class SlackBot extends Bot {
  /**
   * this is our class constructor, it accepts settings that is an object
   */
  constructor(settings) {
    super(settings);
    this.settings = settings;
    this.settings.name = this.settings.name || 'norrisbot';
    this.dbPath = settings.dbPath;
    this.user = null;
    this.db = null;
  }

  /**
   * randomJoke gets a random joke from the chuck norris api
   */
  async randomJoke() {
    try {
      const request = await axios.get('http://api.icndb.com/jokes/random');
      const joke = request.data.value.joke;
      return joke;
    } catch (e) {
      return e;
    }
  }

  /**
   * _loadBotUser finds the object that has the same username of our bot within the users array
   */
  _loadBotUser() {
    const botUser = this.users.filter(user => user.name === this.name);
    return this.user = botUser.length > 0 ? botUser[0] : null;
  }

  /**
   * _connectDB connects our bot to MongoDB using the constructor parameter dbPath
   */
  _connectDB() {
    require('./db').connect(this.dbPath);
  }

  /**
   * _welcomeMessage gives a welcome message when the bot is on the first run
   */
  _welcomeMessage() {
    // REVIEW: here
    const message = `Hi guys, roundhouse-kick anyone? \n I can tell jokes, but very honest ones. Just say 'Chuck Norris' or ${this.name} to invoke me!`;
    // this method is inherated from the parent class Bot
    return this.postMessageToChannel(this.channels[this.channels.length - 1].name, message, { as_user: true });
  };

  /**
   * _firstRunCheck check on the db if the bot has been previously run
   */
  _firstRunCheck() {
    // find the bot on our db
    BotModel.findOne({ name: this.settings.name }, (err, data) => {
      if (err) return console.log('DB Error: ', err);
      // get current time
      const currentTime = (new Date()).toJSON();
      // if there is no data, it means this is a first time run
      if (!data) {
        this._welcomeMessage();
        const bot = new BotModel({
          name: this.settings.name,
          last_run: currentTime
        });
        return bot.save();
      }
      // if there is data, just update the last_run
      return BotModel.update({ name: this.settings.name }, { $set: { last_run: currentTime } } );
    });
  };

  /**
   * _onStart do three things:
   * 1) Load all the metadata related to the user representing the bot itself on the current Slack organization
   * 2) Connect to the MongoDB
   * 3) Check if it's the first time the bot is executed
   */
  _onStart() {
    this._loadBotUser();
    this._connectDB();
    this._firstRunCheck();
  }

  /**
   * _isChatMessage checks if the message is of type 'message' and if it has text on it
   */
  _isChatMessage(message) {
    return message.type === 'message' && Boolean(message.text);
  }

  /**
   * _isChannelConversation allow us to verify if the message is directed to a channel
   */
  _isChannelConversation(message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C';
  }

  /**
   * _isFromBot allow us to see if the message comes from an user that is not the bot
   */
  _isFromBot(message) {
    return message.user === this.user.id;
  }

  /**
   * _isMentioningChuckNorris allow us to know if the message contains chuck norris name or the bot.name
   */
  _isMentioningChuckNorris(message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 || message.text.toLowerCase().indexOf(this.name) > -1;
  }

  /**
   * _getChannelById allow us to get a channel by its id
   */
  _getChannelById(channelId) {
    const channel = this.channels.filter(item => item.id === channelId);
    return channel.length > 0 ? channel[0] : null;
  }

  /**
   * _replyWithRandomJoke posts on the channel a random joke from the randomJoke method
   */
  async _replyWithRandomJoke(message) {
    const channel = this._getChannelById(message.channel);
    try {
      const joke = await this.randomJoke();
      return this.postMessageToChannel(channel.name, joke, { as_user: true });
    } catch(e) {
      return e;
    }
  }

  /**
   * _onMessage will intercept every real time API message that is redeable by our bot
   * and depends on the content of the message will reply a random joke or not
   */
  _onMessage(message) {
    if (
      this._isChatMessage(message) &&
      this._isChannelConversation(message) &&
      !this._isFromBot(message) &&
      this._isMentioningChuckNorris(message)
    )
      this._replyWithRandomJoke(message);
  }

  /**
   * run is a method to initialize our bot
   */
  run() {
    this.on('start', this._onStart);
    this.on('message', this._onMessage);
  }
}

// export norris bot
module.exports = SlackBot;
