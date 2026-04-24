import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(
  here,
  "../../../node_modules/hersheytext/svg_fonts/EMSAllure.svg",
);
const outputPath = resolve(
  here,
  "../src/assets/emsAllureFont.json",
);

const svg = readFileSync(sourcePath, "utf8");

function matchFirstAttribute(input, attribute) {
  const pattern = new RegExp(`${attribute}="([^"]*)"`);
  const match = input.match(pattern);
  return match ? match[1] : null;
}

const fontFaceMatch = svg.match(/<font-face[^>]*\/?>/);
const fontMatch = svg.match(/<font[^>]*>/);

if (!fontFaceMatch || !fontMatch) {
  throw new Error("Unable to locate font/face metadata in EMSAllure.svg");
}

const unitsPerEm = Number(matchFirstAttribute(fontFaceMatch[0], "units-per-em") ?? "1000");
const ascent = Number(matchFirstAttribute(fontFaceMatch[0], "ascent") ?? "800");
const descent = Number(matchFirstAttribute(fontFaceMatch[0], "descent") ?? "-200");
const capHeight = Number(matchFirstAttribute(fontFaceMatch[0], "cap-height") ?? "500");
const xHeight = Number(matchFirstAttribute(fontFaceMatch[0], "x-height") ?? "300");
const defaultAdvance = Number(matchFirstAttribute(fontMatch[0], "horiz-adv-x") ?? "500");

const glyphPattern = /<glyph\b([^\/>]*)\/>/g;
const glyphs = {};

for (const match of svg.matchAll(glyphPattern)) {
  const attrs = match[1];
  const rawUnicode = matchFirstAttribute(attrs, "unicode");
  if (!rawUnicode) {
    continue;
  }
  const unicode = decodeXmlEntity(rawUnicode);
  const advance = Number(matchFirstAttribute(attrs, "horiz-adv-x") ?? String(defaultAdvance));
  const d = matchFirstAttribute(attrs, "d") ?? "";
  glyphs[unicode] = {
    advance,
    d,
  };
}

function decodeXmlEntity(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)));
}

const output = {
  name: "EMS Allure",
  license: "SIL Open Font License",
  unitsPerEm,
  ascent,
  descent,
  capHeight,
  xHeight,
  defaultAdvance,
  glyphs,
};

writeFileSync(outputPath, `${JSON.stringify(output)}\n`, "utf8");

const glyphCount = Object.keys(glyphs).length;
console.log(`Extracted ${glyphCount} glyphs to ${outputPath}`);
