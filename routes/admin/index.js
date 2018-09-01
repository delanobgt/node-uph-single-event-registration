let express = require('express')
let router = express.Router()
let moment = require('moment')
let cloudinary = require('cloudinary')

let upload = require('../../middlewares/upload')
let auth = require('../../middlewares/auth')
let db = require('../../models/index')

router.get('/', async (req, res) => {
  let event = await db.Event.findOne({})
  res.redirect(`/admin/event/${event._id}`)
})

router.get('/event/:id', async (req, res) => {
  let id = req.params.id
  let event = await db.Event.findById(id)
  let showImage = parseInt(req.query.showImage || '0')
  res.render('admin/event-detail', { event, showImage })
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
        } else if (['closeDate', 'openDate'].includes(key)) {
          event[key] = moment(req.body[key], 'YYYY-MM-DDHHmm').toDate()
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

router.put('/event/:id/image', upload.single('image'), async (req, res) => {
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

module.exports = router
