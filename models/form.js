let mongoose = require('mongoose')

let FormSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed,
  ownedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WAITING', 'CONFIRMATION'],
    default: 'PENDING'
  }
})

module.exports = mongoose.model('Form', FormSchema)