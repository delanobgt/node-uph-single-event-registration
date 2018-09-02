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

  let fieldNames = ['Student ID', 'Full Name', 'Study Program'].concat(event.formSchema.map(field => field.label))
  let newFormData = {}
  for (let fieldName of fieldNames) {
    if (!req.body[fieldName]) {
      return res.redirect('back')
    }
    newFormData[fieldName] = req.body[fieldName]
  }
  res.send('successfully registered!')
})

module.exports = router
