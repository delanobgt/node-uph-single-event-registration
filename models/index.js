const DATABASE_URL = process.env.DB_URL

let mongoose = require('mongoose')

mongoose.Promise = Promise
mongoose.set('debug', true)
mongoose.connect(DATABASE_URL)

module.exports.User = require('./user')
module.exports.Event = require('./event')
module.exports.Form = require('./form')
module.exports.Student = require('./student')
