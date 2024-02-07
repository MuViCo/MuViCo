const config = require('./utils/config')
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')

const indexRouter = require('./routes/index')
const signupRouter = require('./routes/signup')
const loginRouter = require('./routes/login')
const usersRouter = require('./routes/users')
const presentationsRouter = require('./routes/presentations')

const app = express()

mongoose.set('strictQuery', false)

morgan.token('data', (req, res) => {
  if (req === 'POST') {
    JSON.stringify(req.body)
  }
})

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :data')
)
app.use(middleware.requestLogger)

app.use('/', indexRouter)
app.use('/api/login', loginRouter)
app.use('/api/signup', signupRouter)
app.use('/api/users', usersRouter)
app.use('/api/home', presentationsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
