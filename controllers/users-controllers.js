const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
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

  const newUser = new User({
    name,
    email,
    password,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg",
    places: [],
  });

  try {
    await newUser.save();
  } catch (error) {
    return next(new HttpError("db cannot sign up the user: " + error, 500));
  }

  res.status(201).json({ user: newUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("db has an error when searching emails", 500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError("invalid credentials for login.", 401));
  }

  res.status(200).json("Successfullly logged in for " + email + " .");
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.login = login;
