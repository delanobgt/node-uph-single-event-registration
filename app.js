/*
 * Environment Variables
 * process.env.
 *          DB_URL
 *          SESSION_SECRET
 * 
 */

// dependencies import
require('dotenv').config()
let path = require('path')
let express = require('express')
let expressSession = require('express-session')
let bodyParser = require('body-parser')
let methodOverride = require('method-override')
let passport = require('passport')
let flash = require('connect-flash')
let socket = require('socket.io')

let db = require('./models/index')

// custom middlewares import
let auth = require('./middlewares/auth')

// main app declaration
const app = express()
const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log()
  console.log(`Server listening on port ${PORT}.`)
  console.log('Ctrl + C to exit.')
  console.log()
})

const io = socket.listen(server)

// view setup
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

// applying middlewares
app.use(expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

// applying custom middlewares
app.use(async (req, res, next) => {
  res.locals.info = req.flash('info')
  res.locals.error = req.flash('error')
  res.locals.moment = require('moment')
  // console.log(req.user)
  
  next()
})

// index
app.get('/', (req, res) => {
  res.redirect('/end-user')
})

// other routes
app.use('/admin', require('./routes/admin/index'))
app.use('/end-user', require('./routes/end-user/index')(io))

app.get('/favicon.ico', (req, res) => {
  res.status(404).send('')
})

app.get('/:displayRoute', async (req, res) => {
  let displayRoute = req.params.displayRoute
  let event = await db.Event.findOne({ displayRoute })
  if (!event) res.redirect('/')
  else res.redirect(`end-user/event/${event._id}`)
})

// not found routes
app.get('*', (req, res) => {
  res.redirect('/')
})
