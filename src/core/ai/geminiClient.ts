import { buildPrompt } from "./promptBuilder";

export async function runGemini(input: any) {
  const prompt = buildPrompt(input);

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!res.ok) throw new Error("Gemini quota/error");

  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}
