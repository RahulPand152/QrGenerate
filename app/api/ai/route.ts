import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a professional QR Code consultant.

Based on this idea: "${prompt}", suggest 3 QR code use cases:
1) URL
2) vCard
3) WiFi or deep link

Return ONLY valid JSON like this:
[
  { "title": "...", "content": "...", "description": "..." }
]
`,
    });

    console.log("AI response:", response);
    // Get raw text output
    const outputText =
      response.output
        ?.map((item: any) => {
          if (!("content" in item)) return ""; // skip items without content
          return item.content
            .filter((c: any) => c.type === "output_text")
            .map((c: any) => c.text)
            .join("");
        })
        .filter(Boolean) // remove empty strings
        .join("\n") || "[]";

    const data = JSON.parse(outputText);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 },
    );
  }
}
