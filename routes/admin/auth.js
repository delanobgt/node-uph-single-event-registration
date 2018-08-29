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
  db.User.register(
    new db.User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err)
        return res.redirect('/auth/register')
      }
      passport.authenticate('local')(req, res, function () {
        res.redirect('/')
      })
    }
  )
})

router.get('/login', (req, res) => {
  res.render('admin/login')
})
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}), (req, res) => {
  // do nothing
})

router.get('/logout', auth.isLoggedIn, (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = router
