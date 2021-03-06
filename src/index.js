const {resolve} = require('path')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const config = require('./config')
const fs = require('fs')
const env = process.env.NODE_ENV

// Set port.
const port = config.get('PORT') || 9000

// print ascii art
var artFile = resolve('src/ascii-art.txt')
var art = fs.readFileSync(artFile, 'utf8')
if (env !== 'test') console.log(art)

// Create Express app.
const app = express()

app.disable('etag')
app.set('views', resolve('src/views'))
app.set('view engine', 'ejs')
app.set('trust proxy', true)

// Configure session.
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.get('SECRET') || 'well, this is something',
  signed: true
}
app.use(session(sessionConfig))

// OAuth2
app.use(passport.initialize())
app.use(passport.session())
app.use(require('./lib/oauth2').router)

// static routes
app.use(express.static(resolve('src/public')))

// Render index page.
app.get('/', (req, res) => {
  // Redirect to login page if not already logged in.
  if (!req.user) return res.render('pages/login')

  res.render('pages/index', {user: req.user})
})

app.get('/bye', (req, res) => {
  // Redirect to index if logged in.
  if (req.user) return res.render('pages/index', {user: req.user})

  res.render('pages/bye')
})

// Basic 404 handler
app.use((req, res) => {
  // res.status(404).send('Not Found')
  res.render('pages/error', {error: 'PAGE NOT FOUND'})
})

// Basic error handler
app.use((err, req, res, next) => {
  /* jshint unused:false */
  console.error(err)
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.render('pages/error', {error: err.response || err.message || `I don't have much to say, sorry :(`})
  // res.status(500).send(err.response || 'Something broke!')
})

if (module === require.main) {
  // Start the server
  const server = app.listen(port, () => {
    const port = server.address().port
    console.log(`App listening on: http://localhost:${port}`)
  })
}

module.exports = app
