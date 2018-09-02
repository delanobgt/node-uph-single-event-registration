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
  // fetch event
  let event = await db.Event.findById(id)

  // make new formData
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

  try {
    // insert form to DB
    let createdForm = await db.Form.create({
      ownedBy: event._id,
      data: newFormData
    })
    // count existing form in DB
    let leftSide = await db.Form.find({
      ownedBy: event._id,
      createdAt: { $lte: createdForm.createdAt },
      status: { $ne: 'REJECTED' }
    })
    // ddecide form status - or even delete it
    if (leftSide.length <= event.seatCount) {
      createdForm.status = 'PENDING'
      createdForm = await createdForm.save()
      return res.render('end-user/result', { status: 'PENDING', event, createdForm, pos: leftSide.length })
    } else if (leftSide.length - event.seatCount <= event.queueCount) {
      return res.render('end-user/result', { status: 'QUEUE', event, createdForm, pos: leftSide.length - event.seatCount })
    } else {
      console.log(await createdForm.remove())
      console.log('deleted')
      return res.render('end-user/result', { status: 'INELIGIBLE', event, createdForm })
    }
  } catch (err) {
    console.log(err)
    return res.redirect('back')  
  }

  return res.redirect('back')  
})

module.exports = router
