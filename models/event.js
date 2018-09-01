let mongoose = require('mongoose')

let EventSchema = new mongoose.Schema({
  name: String,
  displayRoute: String,
  priceRanges: [{
    peopleCount: Number,
    price: Number
  }],
  mainImage: {
    public_id: String,
    secure_url: String
  },
  title: String,
  desc: String,
  openDate: Date,
  closeDate: Date
})


module.exports = mongoose.model('Event', EventSchema)