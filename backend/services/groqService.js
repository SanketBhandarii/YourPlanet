import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const getMood = async (thought) => {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You will give the mood of the thought provided by the user in one word from the given array [happy, joyful, calm, peaceful, relaxed, content, grateful, hopeful, excited, motivated, confident, proud, loved, okay, fine, thoughtful, curious, focused, quiet, blank, numb, tired, sad, lonely, bored, disappointed, confused, worried, uncertain, angry, frustrated, stressed, anxious, overwhelmed, scared, upset, ashamed, guilty, jealous]",
      },
      {
        role: "user",
        content: `Thought: ${thought}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
};

export const generateDailySummary = async (yesterdayData) => {
  const { thoughts, continentData, countryData, cityData, totalCount } = yesterdayData;

  const moodCounts = {};
  thoughts.forEach(t => moodCounts[t.mood] = (moodCounts[t.mood] || 0) + 1);

  const prompt = `You are analyzing how people around the world felt on ${yesterdayData.date}. ${totalCount} people from ${Object.keys(countryData).length} countries shared what they're going through.

MOOD COUNTS:
${JSON.stringify(moodCounts, null, 2)}

WHAT PEOPLE ACTUALLY SAID:
${thoughts.slice(0, 150).map(t => `"${t.thought}" - feeling ${t.mood} (${t.city}, ${t.country})`).join('\n')}

CONTINENT DATA:
${Object.entries(continentData).map(([cont, data]) => `${cont}: ${data.count} people, moods: ${JSON.stringify(data.moods)}`).join('\n')}

COUNTRY DATA:
${Object.entries(countryData).map(([country, data]) => `${country}: ${data.count} people, moods: ${JSON.stringify(data.moods)}`).join('\n')}

CITY DATA:
${Object.entries(cityData).map(([key, data]) => `${data.city}, ${data.country}: ${data.count} people, moods: ${JSON.stringify(data.moods)}`).join('\n')}

Write a detailed analysis in SIMPLE ENGLISH. Respond with valid JSON:

{
  "summary": "Write 5-8 sentences explaining what was going on with people yesterday. Use simple words like 'worried', 'stressed', 'happy' instead of fancy terms. Talk about specific things people mentioned. Make it easy to understand for anyone reading. Include numbers and percentages when relevant. This should be detailed enough that researchers and doctors can learn something useful from it.",
  "happiestCountry": "CountryName or 'Not enough data'",
  "happiestCountryReason": "Explain why in simple words",
  "saddestCountry": "CountryName or 'Not enough data'",
  "saddestCountryReason": "Explain why in simple words. Be kind and understanding.",
  "happiestContinent": "ContinentName or 'Not enough data'",
  "saddestContinent": "ContinentName or 'Not enough data'",
  "continentSummaries": {
    "asia": "Write 4-6 sentences about how Asia felt. Use simple English. Talk about what people mentioned. Include cities if relevant. If not enough data, just say 'Not enough people from Asia shared their thoughts today'",
    "europe": "4-6 sentences about Europe in simple English",
    "africa": "4-6 sentences about Africa in simple English",
    "northAmerica": "4-6 sentences about North America in simple English",
    "southAmerica": "4-6 sentences about South America in simple English",
    "australia": "4-6 sentences about Australia in simple English",
    "antarctica": "Not enough data"
  },
  "happiestCityPerCountry": {
    "India": "CityName or 'Not enough data'",
    "USA": "CityName or 'Not enough data'"
    "..." : "... " so on 
  },
  "saddestCityPerCountry": {
    "India": "CityName or 'Not enough data'",
    "USA": "CityName or 'Not enough data'"
    "..." : "... " so on 
  }
}

WRITING RULES:
- Use SIMPLE everyday English (like explaining to a friend)
- NO fancy academic words (avoid: prevalence, localized, submissions, insufficient, collective)
- YES simple words (use: worried, stressed, feeling, people said, going through)
- Be detailed - write MORE not less (aim for 150-200 words for main summary)
- Talk about specific things people mentioned in their thoughts
- Include percentages and numbers to show patterns
- Be kind and understanding when discussing negative moods
- If not enough data from a place, just say "Not enough people from [place] shared today"
- Write like you're having a conversation, not writing a research paper
- Make it interesting to read, not boring`;

  const response = await groq.chat.completions.create({
    messages: [
      { 
        role: "system", 
        content: "You analyze how people around the world are feeling. Write in simple, everyday English like you're explaining to a friend. Be detailed and interesting. Avoid fancy academic language." 
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: 4000
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
};