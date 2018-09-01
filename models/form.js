let mongoose = require('mongoose')

let FormSchema = new mongoose.Schema({
  ownedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  },
  data: mongoose.Schema.Types.Mixed
})


module.exports = mongoose.model('Form', FormSchema)