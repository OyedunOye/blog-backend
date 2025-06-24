require('dotenv').config()

const PORT = process.env.PORT
const MONGO_DB_URL=process.env.MONGOOSE_DB_URL
const CRYPTO_KEY = process.env.CRYPTO_KEY
const GOOGLE_APP_PASSWORD=process.env.GOOGLE_APP_PASSWORD
const GOOGLE_USER=process.env.GOOGLE_USER
const GOOGLE_SENDER_MAIL=process.env.GOOGLE_SENDER_MAIL

module.exports = {PORT, MONGO_DB_URL, CRYPTO_KEY, GOOGLE_APP_PASSWORD, GOOGLE_USER, GOOGLE_SENDER_MAIL}