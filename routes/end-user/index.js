let express = require('express')
let router = express.Router()

let auth = require('../../middlewares/auth')
let db = require('../../models/index')

router.get('/', (req, res) => {
  res.send('end-user')
})

module.exports = router
