let mongoose = require('mongoose')

let EventSchema = new mongoose.Schema({
  name: String,
  displayRoute: {
    type: String,
    unique: true
  },
  seatCount: Number,
  queueCount: Number,
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
  closeDate: Date,
  paymentDate: Date,
  formSchema: [{
    inputType: {
      type: String,
      enum : ['number', 'text', 'email']
    },
    label: String
  }],
  forms: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form' 
  }]
})


module.exports = mongoose.model('Event', EventSchema)