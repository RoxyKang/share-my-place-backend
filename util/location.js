const axios = require("axios");
const HttpError = require("../models/http-error");

// TODO: REPLACE THIS WITH ACTUAL API KEY
const API_KEY = "";

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;
  console.log(data);
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError("Could not find the address.", 422);
    throw error;
  }

  // will be in the format { lat: number, lng: number }
  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCoordsForAddress;
