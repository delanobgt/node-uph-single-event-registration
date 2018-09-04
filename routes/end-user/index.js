module.exports = (io) => {
  let axios = require('axios')
  let express = require('express')
  let router = express.Router()

  let auth = require('../../middlewares/auth')
  let db = require('../../models/index')

  io.on('connection', async (socket) => {
    console.log('made socket connection', socket.id)
  })

  // INDEX
  router.get('/', async (req, res) => {
    let event = await db.Event.findOne({})
    res.redirect(`/end-user/event/${event._id}`)
  })

  // SHOW event
  router.get('/event/:id', async (req, res) => {
    try {
      let id = req.params.id
      let event = await db.Event.findById(id)
      let confirmationForms = await db.Form.find({
        ownedBy: event._id,
        status: 'CONFIRMATION'
      })
      res.render('end-user/register', {
        currentConfirmationCount: confirmationForms.length,
        event
      })
    } catch (err) {
      console.log(err)
      res.redirect('back')
    }
  })

  // CREATE new form
  router.post('/event/:id/form', async (req, res) => {
    let id = req.params.id
    let event
    try {
      // fetch event
      event = await db.Event.findById(id)
    } catch (err) {
      return res.redirect('back')
    }

    // make new formData
    let fieldNames = ['Student ID', 'Email'].concat(event.formSchema.map(field => field.label))
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
      let sameForms = await db.Form.find({
        ownedBy: event._id,
        'data.Student ID': newFormData['Student ID']
      })
      if (sameForms.length) return res.render('end-user/after', {
        status: 'REJECTED'
      })
    } catch (err) {
      return res.redirect('back')
    }

    try {
      // insert form to DB
      let createdForm = await db.Form.create({
        data: newFormData,
        ownedBy: event._id
      })
      return res.redirect(`/end-user/event/${event._id}/form/${createdForm._id}`)
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }

    return res.redirect('back')
  })

  // after route
  router.get('/event/:eventID/form/:formID', async (req, res) => {
    try {
      let eventID = req.params.eventID
      let formID = req.params.formID

      let event = await db.Event.findById(eventID)
      let form = await db.Form.findById(formID)

      // count existing form in DB
      let leftSide = await db.Form.find({
        ownedBy: event._id,
        createdAt: {
          $lte: form.createdAt
        },
        status: {
          $in : [
            'WAITING',
            'CONFIRMATION'
          ]
        }
      })
      let leftSideLength = leftSide.length + 1

      // decide form status - or even delete it
      if (leftSideLength <= event.seatCount) {
        form.status = 'CONFIRMATION'
        form = await form.save()
        emitSlotCount(event)
        return res.render('end-user/after', {
          status: 'CONFIRMATION',
          event,
          form,
          formatOrderedNumber,
          pos: leftSideLength
        })
      } else if (leftSideLength - event.seatCount <= event.queueCount) {
        form.status = 'WAITING'
        form = await form.save()
        emitSlotCount(event)
        return res.render('end-user/after', {
          status: 'WAITING',
          event,
          form,
          formatOrderedNumber,
          pos: leftSideLength - event.seatCount
        })
      } else {
        await form.remove()
        emitSlotCount(event)
        return res.render('end-user/after', {
          status: 'REJECTED',
          event,
          form,
          formatOrderedNumber
        })
      }
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }
  })

  router.put('/api/form/:id/email', async (req, res) => {
    let id = req.params.id
    try {
      let form = await db.Form.findById(id)
      if (req.body.Email) {
        form.data.Email = req.body.Email
        form.markModified('data')
        await form.save()
      } else throw new Error('no email provided')
      return res.json({
        form
      })
    } catch (err) {
      console.log(err)
      return res.status(404).json({
        error: true
      })
    }
  })

  async function emitSlotCount(event) {
    try {
      let confirmationForms = await db.Form.find({
        ownedBy: event._id,
        status: 'CONFIRMATION'
      })
      let waitingForms = await db.Form.find({
        ownedBy: event._id,
        status: 'WAITING'
      })
      io.sockets.emit('update_slot_count', {
        currentConfirmationCount: confirmationForms.length,
        currentWaitingCount: waitingForms.length,
        totalConfirmationCount: event.seatCount,
        totalWaitingCount: event.queueCount
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  function formatOrderedNumber(n) {
    let suffix
    if ([11, 12, 13].includes(n)) suffix = 'th'
    else if (n % 10 == 1) suffix = 'st'
    else if (n % 10 == 2) suffix = 'nd'
    else if (n % 10 == 3) suffix = 'rd'
    else suffix = 'th'
    return n + suffix
  }

  return router
}