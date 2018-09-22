let mongoose = require('mongoose')

let FormSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed,
  ownedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WAITING', 'CONFIRMATION'],
    default: 'PENDING'
  },
  price: {
    type: Number
  },
  slotNumber: {
    type: Number
  }
})

module.exports = mongoose.model('Form', FormSchema)