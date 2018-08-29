require('dotenv').config()
let express = require('express')
let vhost = require('vhost')

let adminApp = require('./routes/admin/index')

// main app declaration
const app = express()
app.use(vhost('www.huehehe.uphapp.herokuapp.com', adminApp))
app.use(vhost('localhost', adminApp))

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log()
  console.log(`App listening on port ${PORT}`)
  console.log('Press CTRL+C to exit.')
  console.log()
})
