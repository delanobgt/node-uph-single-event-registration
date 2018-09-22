module.exports = (io) => {
  let axios = require('axios')
  let express = require('express')
  let router = express.Router()
  let mailer = require('../../modules/mailer')
  let moment = require('moment')

  let auth = require('../../middlewares/auth')
  let db = require('../../models/index')

  io.on('connection', async (socket) => {
    console.log('made socket connection', socket.id)
  })

  router.get('/api/student/:studentID', async (req, res) => {
    try {
      let student = await axios.get(`https://psi-uph-api.herokuapp.com/students/api/${req.params.studentID}`)
      res.json(student.data)
    } catch (err) {
      console.log(err)
      res.json(null)
    }
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
        status: { $in: ['CONFIRMATION', 'ACCEPTED', 'REJECTED'] }
      })
      res.render('end-user/register', {
        currentConfirmationCount: confirmationForms.length,
        event,
        formatOrderedNumber
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

    // check for register moment
    if (!moment(Date.now()).isBetween(moment(event.openDate), moment(event.closeDate))) {
      return res.render('end-user/after', { status: 'REJECTED' })
    }

    // check for duplicate registrant
    try {
      let sameForms = await db.Form.find({
        ownedBy: event._id,
        'data.Student ID': req.body['Student ID']
      })
      if (sameForms.length) 
        return res.render('end-user/after', { status: 'REJECTED' })
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
          let student = await axios.get(`https://psi-uph-api.herokuapp.com/students/api/${req.body[fieldName]}`)
          student = student.data
          console.log(student)
          newFormData['Student ID'] = student.studentID
          newFormData['Full Name'] = student.name
          newFormData['Study Program'] = student.studyProgram
        } catch (err) {
          console.log(err)
          return res.redirect('back')
        }
      } else {
        newFormData[fieldName] = req.body[fieldName]
      }
    }

    // insert form to DB
    let form
    try {
      form = await db.Form.create({
        data: newFormData,
        ownedBy: event._id
      })
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }

    try {
      // count existing form in DB
      let leftSide = await db.Form.find({
        ownedBy: event._id,
        createdAt: {
          $lte: form.createdAt
        },
        status: { $in: ['CONFIRMATION', 'ACCEPTED', 'REJECTED'] }
      })
      let leftSideLength = leftSide.length + 1

      // decide form status - or even delete it
      if (leftSideLength <= event.seatCount) {
        // calculate registrant's ordering
        let price = -1, priceIndex = leftSideLength
        if (event.priceRanges.length) {
          for (let priceRange of event.priceRanges) {
            if (priceIndex <= priceRange.peopleCount) {
              price = priceRange.price
              break
            }
            priceIndex -= priceRange.peopleCount
          }
        }
        form.status = 'CONFIRMATION'
        form.price = price
        form.slotNumber = leftSideLength
        form = await form.save()
        emitSlotCount(event)
        mailer.createAndSendEmail({ form, event, formatOrderedNumber })
        return res.redirect(`/end-user/event/${event._id}/form/${form._id}`)
      } else if (leftSideLength - event.seatCount <= event.queueCount) {
        form.status = 'WAITING'
        form.slotNumber = leftSideLength - event.seatCount
        form = await form.save()
        emitSlotCount(event)
        mailer.createAndSendEmail({ form, event, formatOrderedNumber })
        return res.redirect(`/end-user/event/${event._id}/form/${form._id}`)
      } else {
        form = await form.remove()
        emitSlotCount(event)
        return res.render('end-user/after', { status: 'REJECTED' })
      }
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }    

    return res.redirect('back')
  })

  // SHOW after
  router.get('/event/:eventID/form/:formID', async (req, res) => {
    try {
      let eventID = req.params.eventID
      let formID = req.params.formID
      let event = await db.Event.findById(eventID)
      let form = await db.Form.findById(formID)

      return res.render('end-user/after', {
        status: form.status,
        event,
        form,
        price: form.price,
        formatOrderedNumber
      })
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }
  })

  router.put('/event/:eventID/form/:formID/email', async (req, res) => {
    let eventID = req.params.eventID
    let formID = req.params.formID
    try {
      let event = await db.Event.findById(eventID)
      let form = await db.Form.findById(formID)
      if (req.body.Email) {
        form.data.Email = req.body.Email
        form.markModified('data')
        await form.save()
        mailer.createAndSendEmail({ form, event, formatOrderedNumber })
      } else throw new Error('no email provided')
      return res.redirect('/')
    } catch (err) {
      console.log(err)
      return res.redirect('back')
    }
  })

  async function emitSlotCount(event) {
    try {
      let confirmationForms = await db.Form.find({
        ownedBy: event._id,
        status: { $in: ['CONFIRMATION', 'ACCEPTED', 'REJECTED'] }
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