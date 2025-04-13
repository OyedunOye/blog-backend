require('dotenv').config()

const PORT = process.env.PORT
const MONGO_DB_URL=process.env.MONGOOSE_DB_URL
const CRYPTO_KEY = process.env.CRYPTO_KEY

module.exports = {PORT, MONGO_DB_URL, CRYPTO_KEY}