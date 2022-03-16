const axios = require("axios");
const HttpError = require("../models/http-error");
const data = require("../local.settings.json");

const googleMapApiKey = data.googleMapApiKey;

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${googleMapApiKey}`
  );

  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError("Could not find the address.", 422);
    throw error;
  }

  // will be in the format { lat: number, lng: number }
  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCoordsForAddress;
