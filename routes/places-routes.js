const express = require("express");
const { check } = require("express-validator");
const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

// The order of setting up the router matters!
// here it'll first search if the url matches the first path, if not, then move on to the next
// so ".../user" will work because "user" will be interpreted as a :pid

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

// add route authentication, above paths are fine
router.use(checkAuth);

// a path can have multiple middleware registered
// and they will be executed from left to right
// here we call the check function immediately to check the request body property "title" is empty or not
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlaceById
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
