const DATABASE_URL = process.env.DB_URL

let mongoose = require('mongoose')

mongoose.Promise = Promise
mongoose.set('debug', true)
mongoose.connect(DATABASE_URL)

module.exports.User = require('./user')
