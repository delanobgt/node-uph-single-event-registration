let axios = require('axios')
let express = require('express')
let router = express.Router()

let auth = require('../../middlewares/auth')
let db = require('../../models/index')

router.get('/', async (req, res) => {
  let event = await db.Event.findOne({})
  res.redirect(`/end-user/event/${event._id}`)
})

router.get('/event/:id', async (req, res) => {
  let id = req.params.id
  let event = await db.Event.findById(id)
  res.render('end-user/index', { event })
})

router.post('/event/:id/form', async (req, res) => {
  let id = req.params.id
  let event = await db.Event.findById(id)

  let fieldNames = ['Student ID'].concat(event.formSchema.map(field => field.label))
  let newFormData = {}
  for (let fieldName of fieldNames) {
    if (!req.body[fieldName]) {
      return res.redirect('back')
    }
    if (fieldName === 'Student ID') {
      try {
        let student = await axios(`https://psi-uph-api.herokuapp.com/students/api/${req.body[fieldName]}`)
        newFormData['Student ID'] = student.data.student_id
        newFormData['Full Name'] = student.data.name
        newFormData['Study Program'] = student.data.study_program.name
      } catch (err) {
        console.log(err)
        return res.redirect('back')  
      }
    } else {
      newFormData[fieldName] = req.body[fieldName]
    }
  }
  res.json(newFormData)
})

module.exports = router
