'use strict';

// node modules
const mongoose = require('mongoose');

// export connect db function
module.exports.connect = (uri) => {
  // connect to mongo db
  mongoose.connect(uri);
  // plug in the promise library:
  mongoose.Promise = global.Promise;
  // on connection
  mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err}`);
    process.exit(1);
  });
  // require model
  require('./bot');
};
