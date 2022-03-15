const express = require("express");
const bodyParser = require("body-parser");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

// first setup the bodyParser middleware before reaching other routes
// call next() automatically and add the json data
app.use(bodyParser.json());

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

app.listen(4000);
