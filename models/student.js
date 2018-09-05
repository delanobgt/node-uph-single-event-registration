let mongoose = require('mongoose')

let StudentSchema = new mongoose.Schema({
  name: String,
  studentID: {
    type: String,
    unique: true
  },
  studyProgram: String
})


module.exports = mongoose.model('Student', StudentSchema)