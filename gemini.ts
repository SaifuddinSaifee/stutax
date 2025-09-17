import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import { prompt } from "./prompt";

const ai = new GoogleGenAI({});

export async function analyzeW2Image(
  file: Blob | File | string
): Promise<string> {
  const uploaded = await ai.files.upload({
    file,
  });
  if (!uploaded.uri || !uploaded.mimeType) {
    throw new Error("Failed to upload file for analysis");
  }
  const uri = uploaded.uri as string;
  const mimeType = uploaded.mimeType as string;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      createUserContent([
        prompt,
        createPartFromUri(uri, mimeType),
      ]),
    ],
  });
  return response.text ?? "";
}

// Backward-compatible helper for local testing with a hardcoded image path
export async function main() {
  return analyzeW2Image("W2_1_B_page-0001_reduced.jpg");
}
