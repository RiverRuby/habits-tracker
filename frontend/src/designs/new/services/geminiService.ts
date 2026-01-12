import { GoogleGenAI } from "@google/genai";

// Ideally, this should be in an environment variable, but for the purpose of this demo structure:
// The user is expected to provide the key via process.env.API_KEY or we handle the missing key gracefully.
const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;

try {
    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
}

export const getHabitMotivation = async (habitTitle: string, streak: number): Promise<string> => {
  if (!ai) {
    return "Keep pushing forward! (AI Key missing)";
  }

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are a tough, brutalist gym coach or productivity guru.
      Give me a very short, punchy, aggressive but encouraging 1-sentence motivation for someone tracking their habit: "${habitTitle}".
      They currently have a streak of ${streak} days.
      Do not use quotes. Keep it under 15 words. UPPERCASE ONLY.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "STAY HARD.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "FOCUS ON THE GOAL.";
  }
};

export const suggestHabitTitle = async (mood: string): Promise<string> => {
    if (!ai) return "DRINK WATER";

    try {
        const model = "gemini-3-flash-preview";
        const prompt = `
            Suggest a short, punchy, 2-3 word habit title for someone who wants to feel "${mood}".
            Examples: MORNING RUN, READ BOOKS, DEEP WORK.
            Return ONLY the title. Uppercase.
        `;
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text?.trim() || "TAKE A WALK";
    } catch (e) {
        return "READ 30 MINS";
    }
}
