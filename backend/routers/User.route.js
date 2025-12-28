import Router from "express";
import { getMood } from "../services/groqService.js";
import UserModel from "../models/UserModel.js";
import { generateAnonId } from "../utils/generateAnonId.js";
const router = Router();

router.post("/give/thought", async (req, res) => {
  try {
    const { thought, latitude, longitude, continent, country, state, city } =
      req.body;
    if (!thought) {
      return res.status(400).json({ res: "No thought provided" });
    }

    let anonId = req.cookies.anonId;
    if (!anonId) {
      anonId = generateAnonId();
    }

    const today = new Date().toISOString().slice(0, 10);
    // checking mood
    const mood = await getMood(thought);

    const User = await UserModel.create({
      thought,
      latitude,
      longitude,
      continent,
      country,
      state,
      city,
      mood: mood.choices[0].message.content,
      date: today,
      anonId,
    });

    res.cookie("anonId", anonId, {
      httpOnly: true,
      //   secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24,
    });

    return res.status(200).json({ res: User });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        res: "You’ve already shared today’s mood 🌍 Come back tomorrow",
      });
    }
    throw error;
  }
});

export default router;
