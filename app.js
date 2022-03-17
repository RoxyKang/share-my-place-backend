const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

// first set up the bodyParser middleware before reaching other routes
// call next() automatically and add the json data
app.use(bodyParser.json());

// to make it work for browser cors policy
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

// needs to start with /api/places/...
app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

// handles unsupported routes
// this will only be reached if none of the routes above is entered
app.use((req, res, next) => {
  throw new HttpError("Could not find this route.", 404);
});

// error-handling middleware function
// will only be executed on the requests that have an error
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  // no response has been sent yet
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

const url =
  "mongodb+srv://jzkang:Kangjz990118_@cluster0.ajsuv.mongodb.net/mern?retryWrites=true&w=majority";

mongoose
  .connect(url)
  .then(() => {
    app.listen(4000);
  })
  .catch((err) => {
    console.log(err);
  });
