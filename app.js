const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(logger("dev"));
//по умолчание в express у запросов нету body,  добавляем этими двуу строчками снизу
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "jade");

// Раздавать статические файлы из папки 'uploads'
app.use("/uploads", express.static("uploads"));

// http://localhost:3000/api/register
app.use("/api", require("./routes"));

//отвечает за загрузку картинок, также добавим пакет / npm i multer
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
