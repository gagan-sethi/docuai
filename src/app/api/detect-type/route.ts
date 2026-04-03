/**
 * POST /api/detect-type
 * Accepts a file (image/pdf) and uses GPT-4o Vision to determine
 * if the document is handwritten or typed/printed.
 *
 * Returns: { type: "handwritten" | "typed", confidence: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { openai, isAIConfigured, aiProvider, azureDeployment } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Determine mime type
    let mimeType = file.type || "image/jpeg";
    if (file.name.endsWith(".pdf")) {
      mimeType = "application/pdf";
    }

    // For PDFs, we can't send directly to Vision — use a heuristic or
    // just default to "typed" since most PDFs are typed
    if (mimeType === "application/pdf") {
      return NextResponse.json({
        type: "typed",
        confidence: 70,
        method: "heuristic",
        reason: "PDF documents are typically typed/printed. Toggle manually if handwritten.",
      });
    }

    // Check if AI is configured
    if (!isAIConfigured || !openai) {
      // Fallback: default to typed
      return NextResponse.json({
        type: "typed",
        confidence: 50,
        method: "fallback",
        reason: "AI not configured — defaulting to typed.",
      });
    }

    // Use GPT-4o Vision to analyze the image
    const model = (aiProvider === "azure" ? azureDeployment : "gpt-4o") || "gpt-4o";

    const response = await openai.chat.completions.create({
      model,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are a document analysis expert. Analyze the provided image and determine if the text in the document is HANDWRITTEN or TYPED/PRINTED. Respond ONLY with valid JSON: {\"type\": \"handwritten\" or \"typed\", \"confidence\": 0-100}. No other text.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Is this document handwritten or typed/printed? Analyze the text style, pen strokes vs uniform fonts, alignment irregularities, etc.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "low", // low detail is faster and cheaper
              },
            },
          ],
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content?.trim() || "";

    // Parse the JSON response
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          type: parsed.type === "handwritten" ? "handwritten" : "typed",
          confidence: Math.min(100, Math.max(0, parsed.confidence || 80)),
          method: "gpt4o-vision",
        });
      }
    } catch {
      // If parsing fails, check for keywords
      const lower = content.toLowerCase();
      if (lower.includes("handwritten")) {
        return NextResponse.json({
          type: "handwritten",
          confidence: 75,
          method: "gpt4o-vision-fallback",
        });
      }
    }

    // Default to typed
    return NextResponse.json({
      type: "typed",
      confidence: 75,
      method: "gpt4o-vision",
    });
  } catch (error) {
    console.error("[detect-type] Error:", error);
    // On error, default to typed
    return NextResponse.json({
      type: "typed",
      confidence: 50,
      method: "error-fallback",
      reason: error instanceof Error ? error.message : "Detection failed",
    });
  }
}
