const mongoose = require('mongoose')
const config = require('../config');
const logger = require('../logger');


logger.info("Connecting to mongo blog_db")

const connectdb = () => {
    mongoose.connect(config.MONGO_DB_URL).then(() =>
    logger.info("Connected to mongo db blog database")).catch((error) =>
    logger.error("Failed to connect to mongo db blog_db", error)
    )
}

module.exports = connectdb