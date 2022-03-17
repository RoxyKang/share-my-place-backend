const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const HttpError = require("../models/http-error");

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // gets all properties except for password
  } catch (error) {
    return next(new HttpError("Fetching users failed.", 500));
  }

  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs.", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("db has an error when searching emails", 500));
  }

  if (existingUser) {
    return next(new HttpError("user already existed", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); // "12": level of hashing
  } catch (error) {
    return next(new HttpError("Could not hash password."));
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await newUser.save();
  } catch (error) {
    return next(new HttpError("db cannot sign up the user: " + error, 500));
  }

  let token;
  try {
    token = jwt.sign({ userId: newUser.id, email: newUser.email }, "secretKey", {
      expiresIn: "1h",
    });
  } catch (error) {
    return next(error);
  }

  res.status(201).json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("db has an error when searching emails", 500));
  }

  if (!existingUser) {
    return next(new HttpError("User not exist.", 404));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(new HttpError("Could not login you in. Invalid credentials.", 500));
  }

  if (!isValidPassword) {
    return next(new HttpError("invalid credentials for login.", 401));
  }

  let token;
  try {
    // key same as signup
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "secretKey",
      {
        expiresIn: "1h",
      }
    );
  } catch (error) {
    return next(error);
  }

  res
    .status(200)
    .json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.login = login;
