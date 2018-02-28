"use strict"

var cradle = require('cradle')

cradle.setup({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  cache: false,
  timeout: 5000
})

var conn = new (cradle.Connection)({
  secure: true,
  auth: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
})

module.exports = function(dbname){
  return conn.database(dbname)
}
