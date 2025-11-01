#!/usr/bin/env node

// Minimal Gemini API smoke test using native fetch (Node 18+)
// Usage: GOOGLE_API_KEY=... node scripts/test_gemini.mjs "Your prompt here"

const API_KEY = process.env.GOOGLE_API_KEY;
const API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const prompt = process.argv.slice(2).join(" ") || "Say hello in one short sentence.";

if (!API_KEY) {
  console.error("ERROR: GOOGLE_API_KEY is not set in the environment.");
  process.exit(1);
}

async function main() {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${encodeURIComponent(
    MODEL
  )}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON response. Raw response:\n", text);
    process.exit(1);
  }

  if (!res.ok) {
    console.error("Request failed:", JSON.stringify(json, null, 2));
    process.exit(1);
  }

  // Try to extract the text response safely
  const candidate = json.candidates && json.candidates[0];
  const parts = candidate && candidate.content && candidate.content.parts;
  const outputText = parts && parts[0] && (parts[0].text || parts[0].inline_data);

  console.log("Model:", MODEL);
  console.log("Prompt:", prompt);
  if (outputText) {
    console.log("Response:");
    console.log(typeof outputText === "string" ? outputText : JSON.stringify(outputText));
  } else {
    console.log("Full response (no simple text part found):\n" + JSON.stringify(json, null, 2));
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});


