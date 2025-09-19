/*
  Utilities to extract pure JSON from text that may include fenced code blocks.

  Behavior:
  - If one or more fenced code blocks with a language tag exist, prefer the first with a
    `json` language tag (case-insensitive). If none are `json`, select the first with any
    language tag.
  - Remove code fences and any content outside the selected fenced block.
  - Validate and normalize the extracted JSON by parsing then re-stringifying.
  - If no fenced block with a language tag is found, attempt to parse the whole input as JSON.
*/

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface FencedBlock {
  language: string;
  content: string;
}

function findFencedBlocksWithLanguage(input: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  const text = input.replace(/\r\n?/g, "\n");

  let searchIndex = 0;
  while (true) {
    const openIndex = text.indexOf("```", searchIndex);
    if (openIndex === -1) break;

    const openLineEnd = text.indexOf("\n", openIndex + 3);
    if (openLineEnd === -1) break;

    const infoString = text
      .slice(openIndex + 3, openLineEnd)
      .trim();

    const language = infoString.split(/\s+/)[0] ?? "";
    // Only consider blocks that include a non-empty language tag
    if (language.length === 0) {
      searchIndex = openLineEnd + 1;
      continue;
    }

    const closeIndex = text.indexOf("```", openLineEnd + 1);
    if (closeIndex === -1) break;

    const content = text.slice(openLineEnd + 1, closeIndex);
    blocks.push({ language, content });
    searchIndex = closeIndex + 3;
  }

  return blocks;
}

function stripOuterFences(content: string): string {
  let result = content.trim();
  const fencePattern = /^```[\s\S]*?\n([\s\S]*?)\n```$/;
  for (let i = 0; i < 2; i++) {
    const match = result.match(fencePattern);
    if (!match) break;
    result = match[1].trim();
  }
  return result;
}

function tryParseJson(text: string): JsonValue {
  return JSON.parse(text) as JsonValue;
}

function extractBalancedJson(text: string): string | null {
  const trimmed = text.trim();

  const startObj = trimmed.indexOf("{");
  const startArr = trimmed.indexOf("[");
  const starts: number[] = [];
  if (startObj !== -1) starts.push(startObj);
  if (startArr !== -1) starts.push(startArr);
  if (starts.length === 0) return null;

  const start = Math.min(...starts);
  const opener = trimmed[start];
  const closer = opener === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === opener) depth += 1;
    else if (ch === closer) depth -= 1;

    if (depth === 0) {
      return trimmed.slice(start, i + 1);
    }
  }
  return null;
}

export function extractJsonString(input: string): string {
  const blocks = findFencedBlocksWithLanguage(input);

  let candidate: string | null = null;
  if (blocks.length > 0) {
    const jsonBlock = blocks.find(b => b.language.toLowerCase() === "json");
    const selected = jsonBlock ?? blocks[0];
    candidate = stripOuterFences(selected.content);
  } else {
    candidate = input.trim();
  }

  const primary = candidate.trim();
  try {
    const value = tryParseJson(primary);
    return JSON.stringify(value);
  } catch {
    const balanced = extractBalancedJson(primary);
    if (balanced != null) {
      const value = tryParseJson(balanced);
      return JSON.stringify(value);
    }
    throw new Error("Failed to extract valid JSON from input text");
  }
}

export function extractJsonObject<T = JsonValue>(input: string): T {
  const json = extractJsonString(input);
  return JSON.parse(json) as T;
}


