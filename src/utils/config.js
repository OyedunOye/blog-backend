require('dotenv').config()

const PORT = process.env.PORT
const MONGO_DB_URL=process.env.MONGOOSE_DB_URL
const CRYPTO_KEY = process.env.CRYPTO_KEY
const CLOUDINARY_URL=process.env.CLOUDINARY_URL

module.exports = {PORT, MONGO_DB_URL, CRYPTO_KEY, CLOUDINARY_URL}