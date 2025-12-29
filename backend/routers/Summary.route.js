import Router from "express";
import UserModel from "../models/UserModel.js";
import SummaryModel from "../models/SummaryModel.js";
import { generateDailySummary } from "../services/groqService.js";

const router = Router();

router.post("/generate", async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const existingSummary = await SummaryModel.findOne({ date: yesterday });
    if (existingSummary) {
      return res
        .status(200)
        .json({ message: "Summary already exists", summary: existingSummary });
    }

    const thoughts = await UserModel.find({ date: yesterday });
    
    if (thoughts.length === 0) {
      const noDataSummary = await SummaryModel.create({
        date: yesterday,
        summary:
          "No one shared their feelings yesterday. We need more people to participate to understand how the world is feeling.",
        happiestCountry: "Not enough data",
        saddestCountry: "Not enough data",
        happiestContinent: "Not enough data",
        saddestContinent: "Not enough data",
        continentSummaries: {
          asia: "No one from Asia shared their thoughts yesterday.",
          europe: "No one from Europe shared their thoughts yesterday.",
          africa: "No one from Africa shared their thoughts yesterday.",
          northAmerica:
            "No one from North America shared their thoughts yesterday.",
          southAmerica:
            "No one from South America shared their thoughts yesterday.",
          australia: "No one from Australia shared their thoughts yesterday.",
        },
        happiestCityPerCountry: {},
        saddestCityPerCountry: {},
      });

      return res.status(200).json({
        message: "Summary created for day with no data",
        summary: noDataSummary,
      });
    }

    const continentData = {};
    const countryData = {};
    const cityData = {};

    thoughts.forEach((t) => {
      if (!continentData[t.continent])
        continentData[t.continent] = { count: 0, moods: {} };
      continentData[t.continent].count++;
      continentData[t.continent].moods[t.mood] =
        (continentData[t.continent].moods[t.mood] || 0) + 1;

      if (!countryData[t.country])
        countryData[t.country] = { count: 0, moods: {} };
      countryData[t.country].count++;
      countryData[t.country].moods[t.mood] =
        (countryData[t.country].moods[t.mood] || 0) + 1;

      const cityKey = `${t.city}_${t.country}`;
      if (!cityData[cityKey])
        cityData[cityKey] = {
          city: t.city,
          country: t.country,
          count: 0,
          moods: {},
        };
      cityData[cityKey].count++;
      cityData[cityKey].moods[t.mood] =
        (cityData[cityKey].moods[t.mood] || 0) + 1;
    });

    const yesterdayData = {
      date: yesterday,
      thoughts: thoughts,
      continentData,
      countryData,
      cityData,
      totalCount: thoughts.length,
    };

    const aiSummary = await generateDailySummary(yesterdayData);

    const summary = await SummaryModel.create({
      date: yesterday,
      summary: aiSummary.summary,
      happiestCountry: aiSummary.happiestCountry,
      saddestCountry: aiSummary.saddestCountry,
      happiestContinent: aiSummary.happiestContinent,
      saddestContinent: aiSummary.saddestContinent,
      continentSummaries: aiSummary.continentSummaries,
      happiestCityPerCountry: aiSummary.happiestCityPerCountry || {},
      saddestCityPerCountry: aiSummary.saddestCityPerCountry || {},
    });

    const deleteResult = await UserModel.deleteMany({ date: yesterday });

    return res.status(200).json({
      message: "Summary generated and old data wiped",
      summary,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const latest = await SummaryModel.findOne().sort({ date: -1 });
    if (!latest) {
      return res.status(404).json({ message: "No summaries yet" });
    }
    return res.status(200).json(latest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:date", async (req, res) => {
  try {
    const summary = await SummaryModel.findOne({ date: req.params.date });
    if (!summary) {
      return res.status(404).json({ message: "No summary for this date" });
    }
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
