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

module.exports = router
