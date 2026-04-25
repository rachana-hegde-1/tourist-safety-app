import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function analyzeLocationHistory(recentLocations: any[]) {
  if (!apiKey) {
    console.warn("No GEMINI_API_KEY found, skipping anomaly detection.");
    return null;
  }

  // Use the free-tier model (gemini-1.5-flash)
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // Enforce JSON output formulation
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
  You are an AI anomaly detector for a tourist safety app.
  Given the following recent location coordinate history (ordered newest to oldest), evaluate if there are any sudden, highly abnormal movement patterns (like teleporting several kilometers in under a minute, or extremely erratic movement indicating distress).
  
  Recent Locations:
  ${JSON.stringify(recentLocations, null, 2)}
  
  Return ONLY a raw JSON strictly following this structure (no markdown tags):
  {
    "isAnomaly": boolean,
    "confidence": number, // 0 to 100
    "reason": string
  }

  Be very conservative and filter out normal movement. Flag true ONLY if it looks clearly dangerous, erratic, or physically impossible.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("Error calling Gemini API for Anomaly Detection:", err);
    return null;
  }
}
