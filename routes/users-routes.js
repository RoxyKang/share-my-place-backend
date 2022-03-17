const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();

router.get("/", usersControllers.getAllUsers);

router.post(
  "/signup",
  fileUpload.single("image"), // add the middleware for uploading images
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(), // normalizedEmail(): Test@test.com => test@test.com
    check("password").isLength({ min: 5 }),
  ],
  usersControllers.signUp
);

router.post("/login", usersControllers.login);

module.exports = router;
