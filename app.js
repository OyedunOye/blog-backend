const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const readerRouter = require('./src/routes/readers.route')

// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use("/api/readers", readerRouter)

app.get('/', (req, res) => {
    res.send("Hello World! Welcome to blog's backend 🙂")
  })

module.exports = app