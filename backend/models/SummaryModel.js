import mongoose from "mongoose";

const SummarySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },

  summary: { type: String, required: true },

  happiestCountry: String,
  saddestCountry: String,
  happiestContinent: String,
  saddestContinent: String,

  continentSummaries: {
    asia: String,
    europe: String,
    africa: String,
    northAmerica: String,
    southAmerica: String,
    australia: String,
    antarctica: String,
  },

  happiestCityPerCountry: {
    type: Map,
    of: String,
  },

  saddestCityPerCountry: {
    type: Map,
    of: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Summary", SummarySchema);
