const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // browser: anything but GET will have a OPTIONS sent before the actual request 
  //    to check if the server supports the to-be-sent request
  if (req.method === "OPTIONS") {
    return next();
  }
  let token;
  try {
    token = req.headers.authorization.split(" ")[1]; // Authorization: "Bearer TOKEN"
    if (!token) {
      throw new Error("Authentication failed");
    }

    const decodedToken = jwt.verify(token, "secretKey");
    // at this point, the user is authenticated
    req.userData = { userId: decodedToken.userId }; // dynamically add userData property
    next();
  } catch (error) {
    return next(new HttpError("Authentication failed", 401));
  }
};
