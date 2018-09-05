let express = require('express')
let router = express.Router()
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy

let auth = require('../../middlewares/auth')
let db = require('../../models/index')

passport.use(new LocalStrategy(db.User.authenticate()))
passport.serializeUser(db.User.serializeUser())
passport.deserializeUser(db.User.deserializeUser())

router.get('/register', async (req, res) => {
  res.render('admin/register')
})
router.post('/register', async (req, res) => {
  console.log(req.body.token, process.env.REGISTER_TOKEN)
  if (!(req.body.token && req.body.token === process.env.REGISTER_TOKEN)) 
    return res.redirect('/admin/auth/register')
  db.User.register(
    new db.User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err)
        return res.redirect('/admin/auth/register')
      }
      passport.authenticate('local')(req, res, function () {
        res.redirect('/admin')
      })
    }
  )
})

router.get('/login', (req, res) => {
  res.render('admin/login')
})
router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/admin/auth/login',
}), (req, res) => {
  // do nothing
})

router.get('/logout', auth.isLoggedIn, (req, res) => {
  req.logout()
  res.redirect('/admin')
})

module.exports = router
