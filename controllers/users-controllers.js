const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

let DUMMY_USRES = [
  {
    id: "u1",
    name: "user name1",
    email: "u1@gmail.com",
    password: "u1u1u1",
  },
  {
    id: "u2",
    title: "user name2",
    email: "u2@gmail.com",
    password: "u2u2u2",
  },
];

const getAllUsers = (req, res, next) => {
  res.json({ users: DUMMY_USRES });
};

const signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs.", 422);
  }

  const { name, email, password } = req.body;

  const hasUser = DUMMY_USRES.find((u) => u.email === email);

  if (hasUser) {
    throw new HttpError("User already existed, cannot signup.", 422);
  }

  const newUser = {
    id: uuid(),
    name,
    email,
    password,
  };

  DUMMY_USRES.push(newUser);

  res.status(201).json("Successfully signed up user for " + email + " .");
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const user = DUMMY_USRES.find((u) => {
    return u.email === email && u.password === password;
  });

  if (!user) {
    throw new HttpError("The provided email and password don't match.", 401);
  }

  res.status(200).json("Successfullly logged in for " + email + " .");
};

exports.getAllUsers = getAllUsers;
exports.signUp = signUp;
exports.login = login;
