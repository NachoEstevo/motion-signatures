import emsAllureFont from "../assets/emsAllureFont.json";
import type { SignaturePath, SignatureVector } from "../types";

export type StrokeFontGlyph = {
  advance: number;
  d: string;
};

export type StrokeFont = {
  name: string;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  defaultAdvance: number;
  glyphs: Record<string, StrokeFontGlyph>;
};

export type NameToStrokePathOptions = {
  width?: number;
  height?: number;
  padding?: number;
  font?: StrokeFont;
};

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 120;
const DEFAULT_PADDING = 16;
const DEFAULT_FONT = emsAllureFont as StrokeFont;

type Point = { x: number; y: number };
type PathCommand =
  | { type: "M"; points: Point[] }
  | { type: "L"; points: Point[] }
  | { type: "C"; points: Point[] };

type PathBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type LaidGlyph = {
  char: string;
  glyph: StrokeFontGlyph;
  cursor: number;
  commands: PathCommand[];
};

/**
 * Returns the bundled default single-line signature font (EMS Allure).
 *
 * @returns The default stroke font used when no override is supplied.
 */
export function getDefaultStrokeFont(): StrokeFont {
  return DEFAULT_FONT;
}

/**
 * Converts a typed name into a normalized single-stroke SVG vector so it can
 * be animated as if written, one glyph at a time.
 *
 * Each returned path is a single glyph composed of open strokes, preserving
 * the natural pen-lift moments inside letters like "A" or "t".
 *
 * @param name Name entered by the signer.
 * @param options Output sizing and optional font override.
 * @returns A normalized vector signature with one stroke path per glyph.
 *
 * @example
 * const signature = nameToStrokePath("Ada");
 * console.log(signature.paths.length);
 */
export function nameToStrokePath(
  name: string,
  options: NameToStrokePathOptions = {},
): SignatureVector {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("A name is required");
  }

  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const padding = options.padding ?? DEFAULT_PADDING;
  const font = options.font ?? DEFAULT_FONT;

  const laidGlyphs = layoutGlyphs(trimmedName, font);
  const rawBounds = getRawLayoutBounds(laidGlyphs, font);

  const rawWidth = Math.max(1, rawBounds.maxX - rawBounds.minX);
  const rawHeight = Math.max(1, rawBounds.maxY - rawBounds.minY);
  const scale = Math.min(
    (width - padding * 2) / rawWidth,
    (height - padding * 2) / rawHeight,
  );
  const renderedWidth = rawWidth * scale;
  const renderedHeight = rawHeight * scale;
  const horizontalSlack = Math.max(0, width - padding * 2 - renderedWidth);
  const verticalSlack = Math.max(0, height - padding * 2 - renderedHeight);
  const offsetX = padding + horizontalSlack / 2 - rawBounds.minX * scale;
  const offsetY = padding + verticalSlack / 2 + rawBounds.maxY * scale;

  const paths: SignaturePath[] = [];

  for (const laidGlyph of laidGlyphs) {
    if (laidGlyph.commands.length === 0) {
      continue;
    }

    const transformedCommands = laidGlyph.commands.map<PathCommand>((command) => ({
      type: command.type,
      points: command.points.map((point) => ({
        x: offsetX + (laidGlyph.cursor + point.x) * scale,
        y: offsetY - point.y * scale,
      })),
    }));

    const d = serializeCommands(transformedCommands);
    const glyphBounds = getCommandsBounds(transformedCommands);

    if (!d || !glyphBounds) {
      continue;
    }

    paths.push({
      d,
      length: 0,
      bounds: {
        x: glyphBounds.minX,
        y: glyphBounds.minY,
        width: glyphBounds.maxX - glyphBounds.minX,
        height: glyphBounds.maxY - glyphBounds.minY,
      },
    });
  }

  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    paths,
  };
}

function layoutGlyphs(name: string, font: StrokeFont): LaidGlyph[] {
  const result: LaidGlyph[] = [];
  let cursor = 0;

  for (const char of Array.from(name)) {
    const glyph =
      font.glyphs[char] ??
      font.glyphs[char.toLowerCase()] ??
      font.glyphs[char.toUpperCase()] ??
      {
        advance: font.defaultAdvance,
        d: "",
      };

    result.push({
      char,
      glyph,
      cursor,
      commands: parsePathCommands(glyph.d),
    });

    cursor += glyph.advance;
  }

  return result;
}

function getRawLayoutBounds(
  laidGlyphs: LaidGlyph[],
  font: StrokeFont,
): PathBounds {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = font.descent;
  let maxY = font.ascent;

  for (const laidGlyph of laidGlyphs) {
    for (const command of laidGlyph.commands) {
      for (const point of command.points) {
        const globalX = laidGlyph.cursor + point.x;
        if (globalX < minX) minX = globalX;
        if (globalX > maxX) maxX = globalX;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      }
    }
    const advanceEnd = laidGlyph.cursor + laidGlyph.glyph.advance;
    if (advanceEnd > maxX) maxX = advanceEnd;
    if (laidGlyph.cursor < minX) minX = laidGlyph.cursor;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
    minX = 0;
    maxX = Math.max(1, laidGlyphs.reduce((sum, g) => sum + g.glyph.advance, 0));
  }

  return { minX, minY, maxX, maxY };
}

export function parsePathCommands(d: string): PathCommand[] {
  if (!d) {
    return [];
  }

  const commands: PathCommand[] = [];
  const tokenPattern = /([MLC])([^MLC]*)/g;

  for (const match of d.matchAll(tokenPattern)) {
    const commandChar = match[1];
    const payload = match[2];
    if (!commandChar || payload === undefined) {
      continue;
    }
    const type = commandChar as "M" | "L" | "C";
    const numberMatches = payload.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
    const numbers = numberMatches.map((raw) => Number(raw));
    const stride = type === "C" ? 6 : 2;

    if (numbers.length % stride !== 0 || numbers.length === 0) {
      continue;
    }

    for (let index = 0; index < numbers.length; index += stride) {
      const points: Point[] = [];
      for (let offset = 0; offset < stride; offset += 2) {
        const x = numbers[index + offset];
        const y = numbers[index + offset + 1];
        if (x === undefined || y === undefined) {
          break;
        }
        points.push({ x, y });
      }
      commands.push({ type, points });
    }
  }

  return commands;
}

function serializeCommands(commands: PathCommand[]): string {
  const parts: string[] = [];

  for (const command of commands) {
    const coordinates = command.points
      .flatMap((point) => [roundCoordinate(point.x), roundCoordinate(point.y)])
      .join(" ");
    if (!coordinates) {
      continue;
    }
    parts.push(`${command.type} ${coordinates}`);
  }

  return parts.join(" ");
}

function getCommandsBounds(commands: PathCommand[]): PathBounds | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let hasPoints = false;

  for (const command of commands) {
    for (const point of command.points) {
      hasPoints = true;
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  }

  if (!hasPoints) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function roundCoordinate(value: number): string {
  return Number(value.toFixed(2)).toString();
}
