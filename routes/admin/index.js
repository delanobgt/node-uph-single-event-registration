let express = require('express')
let router = express.Router()

let auth = require('../../middlewares/auth')
let db = require('../../models/index')

router.get('/', async (req, res) => {
  let event = await db.Event.findOne({})
  res.redirect(`/admin/event/${event._id}`)
})

router.get('/event/:id', async (req, res) => {
  let id = req.params.id
  let event = await db.Event.findById(id)
  res.render('admin/event-detail', { event })
})

// db.Event.remove({}, () => {
//   db.Event.create({
//     name: 'name',
//     displayRoute: 'displayRoute',
//     priceRanges: [{
//       peopleCount: 1,
//       price: 10
//     }],
//     title: 'title',
//     desc: 'desc',
//   })
// })

router.put('/api/event/:id', async (req, res) => {
  let id = req.params.id
  try {
    let event = await db.Event.findById(id)
    for (let key in req.body) {
      event[key] = req.body[key]
    }
    await event.save()
    res.json(event)
  } catch (err) {
    res.status(404).json({ msg: 'Failed to update Event'})
  }
})

module.exports = router
