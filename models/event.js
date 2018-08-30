let mongoose = require('mongoose')

let EventSchema = new mongoose.Schema({
  name: String,
  displayRoute: String,
  priceRanges: [{
    peopleCount: Number,
    price: Number
  }],
  title: String,
  desc: String,
})


module.exports = mongoose.model('Event', EventSchema)