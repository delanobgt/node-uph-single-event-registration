let express = require('express')
let router = express.Router()
let moment = require('moment')
let cloudinary = require('cloudinary')

let authRouter = require('./auth')
let mailer = require('../../modules/mailer')
let upload = require('../../middlewares/upload')
let authMW = require('../../middlewares/auth')
let db = require('../../models/index')

router.use('/auth', authRouter)

router.get('/', authMW.isLoggedIn, async (req, res) => {
  let event = await db.Event.findOne({})
  res.redirect(`/admin/event/${event._id}`)
})

router.get('/event/:id', authMW.isLoggedIn, async (req, res) => {
  let id = req.params.id
  let event = await db.Event.findById(id)
  let showImage = parseInt(req.query.showImage || '0')
  res.render('admin/event-detail', { event, showImage })
})

// API - GET REGISTRANTS
router.get('/api/event/:eventID/form', authMW.isLoggedIn, async (req, res) => {
  let eventID = req.params.eventID
  try {
    let event = await db.Event.findById(eventID)
    let forms = await db.Form.find({
      ownedBy: event._id
    })
    res.json(forms)
  } catch (err) {
    console.log(err)
    res.status(404).json({ error: true })
  }
})

// API - POST REGISTRANTS STATUS
router.post('/api/event/:eventID/form/:formID/status', authMW.isLoggedIn, async (req, res) => {
  let eventID = req.params.eventID
  let formID = req.params.formID
  try {
    let event = await db.Event.findById(eventID)
    let form = await db.Form.findById(formID)
    form.status = req.body.status
    await form.save()
    mailer.createAndSendEmail({ form, event })
    res.json(form)
  } catch (err) {
    console.log(err)
    res.status(404).json({ error: true })
  }
})

// UPDATE event
router.put('/api/event/:id', authMW.isLoggedIn, async (req, res) => {
  console.log(req.body)
  let id = req.params.id
  try {
    let event = await db.Event.findById(id)
    let eventCols = Object.keys(db.Event.schema.tree).filter(name => !['id', '_id', '__v'].includes(name))
    for (let key of eventCols) {
      if (req.body[key]) {
        if (['formSchema', 'priceRanges'].includes(key)) {
          if (req.body[key] == 'delete') event[key] = []
          else event[key] = req.body[key]
        } else if (['closeDate', 'openDate', 'paymentDate'].includes(key)) {
          event[key] = moment(req.body[key], 'YYYY-MM-DDHHmm').toDate()
        } else if (['seatCount', 'queueCount'].includes(key)) {
          event[key] = parseInt(req.body[key])
        } else {
          event[key] = req.body[key]
        }
      }
    }
    await event.save()
    res.json(event)
  } catch (err) {
    console.log(err)
    res.status(404).json({ msg: 'Failed to update Event'})
  }
})

router.put('/event/:id/image', authMW.isLoggedIn, upload.single('image'), async (req, res) => {
  let id = req.params.id
  try {
    let event = await db.Event.findById(id)
    await cloudinary.uploader.destroy(event.mainImage.public_id)
    let uploadResult = await cloudinary.uploader.upload(req.file.path)
    event.mainImage.public_id = uploadResult.public_id
    event.mainImage.secure_url = uploadResult.secure_url
    await event.save()
    res.redirect(`/admin/event/${id}?showImage=${1}`)
  } catch (err) {
    console.log(err)
    res.redirect('back')
  }
})

router.delete('/event/:eventID/forms', authMW.isLoggedIn, async (req, res) => {
  let eventID = req.params.eventID
  try {
    await db.Form.remove({ ownedBy: eventID })
    res.json({ success: true })
  } catch (err) {
    console.log(err)
    res.status(404).json({ error: true })
  }
})

module.exports = router
