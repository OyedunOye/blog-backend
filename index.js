const app = require('./app')
const config = require('./src/utils/config')
const db= require('./src/utils/db/db')
const logger = require('./src/utils/logger')

db()

app.listen(config.PORT, () => {
  logger.info(`Blog app server is running on port ${config.PORT}`)
})