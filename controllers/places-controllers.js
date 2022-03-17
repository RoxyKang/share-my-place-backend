const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require("fs");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    // doesn't return a promise, but still can do async stuff (provided by mongoose)
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("internal db error", 500));
  }

  if (!place) {
    // will trigger the error-handling middleware
    return next(new HttpError("Could not find a place for the provided place id.", 404));
  }

  // when the name of the property is equal to the name of the variable
  //    js auto-binds: { place } => { place: place }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(new HttpError("internal db error", 500));
  }

  if (!places || places.length === 0) {
    return next(new HttpError("Could not find a place for the provided user id.", 404)); // will trigger the error-handling middleware
  }

  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // with async function, throw doesn't work well, so we use next()
    return next(new HttpError("Invalid inputs.", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new HttpError("Creating place failed."), 500);
  }

  if (!user) {
    return next(new HttpError("Could not find user for the provide id.", 404));
  }

  try {
    // use a session to manage multiple transactions
    // to make sure the operations are done ONLY when all transactions are successful

    // Note: not like usual operations, if the collection doesn't exist,
    //      it won't be automatically generated when using sessions
    //      we need to make sure they exist beforehand

    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace); // mongodb's push: only adds place's id
    await user.save({ session });
    // changes are saved at this point
    // if any operations above has errors, the changes will automatically be undone by mongodb
    await session.commitTransaction();
  } catch (error) {
    return next(new HttpError(error), 500);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs.", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError("failed to retrieve."), 500);
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("Permission denied to edit this place.", 401));
  }

  // good approach: update on a copy, and then set the entire object back to the array
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    return next(new HttpError("failed to save the updated object."), 500);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    // if two collections have setup a relation,
    // then we can use "populate(property_name)" to get its corressponding document
    // For example, here place.creator is set to be the user document that's refered by the "creator" property
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    return next(new HttpError("failed to retrieve."), 500);
  }

  if (!place) {
    return next(new HttpError("place not existed."), 404);
  }

  // we can use "id" property because we populated "creator"
  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("Permission denied to delete this place.", 401));
  }

  const imagePath = place.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(place); // like push, mongodb will automatically remove the id
    await place.creator.save({ session });
    await session.commitTransaction();
  } catch (error) {
    return next(new HttpError("failed to delete."), 500);
  }

  fs.unlink(imagePath, (err) => console.log(err));

  res.status(200).json({ message: "Deleted place." });
};

// exports a pointer to the function
// don't do "... = getPlaceById()" because that'll execute the function directly
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
