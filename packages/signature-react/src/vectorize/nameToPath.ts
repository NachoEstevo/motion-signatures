import opentype from "opentype.js";
import type { SignaturePath, SignatureVector } from "../types";
import alluraFontUrl from "@fontsource/allura/files/allura-latin-400-normal.woff";

export type FontPath = {
  toPathData: (decimalPlaces?: number) => string;
  getBoundingBox: () => {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type GlyphLike = {
  advanceWidth: number;
  getPath: (x: number, y: number, fontSize: number) => FontPath;
};

export type FontLike = {
  getPath: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
  ) => FontPath;
  unitsPerEm?: number;
  stringToGlyphs?: (text: string) => GlyphLike[];
  getKerningValue?: (leftGlyph: unknown, rightGlyph: unknown) => number;
};

export type NameToPathOptions = {
  width?: number;
  height?: number;
  padding?: number;
  loadFont?: () => Promise<FontLike>;
};

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 120;
const DEFAULT_PADDING = 16;
const DEFAULT_FONT_SIZE = 72;
let cachedFont: FontLike | null = null;

type PathBounds = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type GlyphLayout = {
  path: FontPath;
  bounds: PathBounds;
};

type GlyphCapableFont = FontLike & {
  stringToGlyphs: (text: string) => GlyphLike[];
  getKerningValue: (leftGlyph: unknown, rightGlyph: unknown) => number;
};

/**
 * Converts a typed name into a normalized SVG vector that can be animated
 * exactly like a captured signature.
 *
 * @param name Name entered by the signer.
 * @param options Output sizing and optional dependency injection hooks.
 * @returns A normalized vector signature with a single SVG path.
 *
 * @example
 * const signature = await nameToPath("Ada");
 * console.log(signature.viewBox);
 */
export async function nameToPath(
  name: string,
  options: NameToPathOptions = {},
): Promise<SignatureVector> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("A name is required");
  }

  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const padding = options.padding ?? DEFAULT_PADDING;
  const loadFont = options.loadFont ?? loadDefaultFont;
  const font = await loadFont();

  if (supportsGlyphLayout(font)) {
    return buildGlyphVector(trimmedName, font, { width, height, padding });
  }

  const previewPath = font.getPath(trimmedName, 0, 0, DEFAULT_FONT_SIZE);
  const previewBounds = previewPath.getBoundingBox();
  const rawWidth = Math.max(1, previewBounds.x2 - previewBounds.x1);
  const rawHeight = Math.max(1, previewBounds.y2 - previewBounds.y1);
  const scale = Math.min(
    (width - padding * 2) / rawWidth,
    (height - padding * 2) / rawHeight,
  );
  const fontSize = DEFAULT_FONT_SIZE * scale;
  const renderedWidth = rawWidth * scale;
  const renderedHeight = rawHeight * scale;
  const horizontalSlack = Math.max(0, width - padding * 2 - renderedWidth);
  const verticalSlack = Math.max(0, height - padding * 2 - renderedHeight);
  const offsetX = padding + horizontalSlack / 2 - previewBounds.x1 * scale;
  const baseline =
    padding + verticalSlack / 2 - previewBounds.y1 * scale;
  const finalPath = font.getPath(trimmedName, offsetX, baseline, fontSize);

  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    paths: [
      {
        d: finalPath.toPathData(2),
        length: 0,
        bounds: {
          x: offsetX + previewBounds.x1 * scale,
          y: baseline + previewBounds.y1 * scale,
          width: renderedWidth,
          height: renderedHeight,
        },
      },
    ],
  };
}

function buildGlyphVector(
  name: string,
  font: GlyphCapableFont,
  options: { width: number; height: number; padding: number },
): SignatureVector {
  const unitsPerEm = font.unitsPerEm ?? 1000;
  const previewGlyphs = layoutGlyphs(font, name, DEFAULT_FONT_SIZE, 0, 0, unitsPerEm);
  const previewBounds = getAggregateBounds(previewGlyphs);

  if (!previewBounds) {
    throw new Error("Unable to generate a signature path from the provided name");
  }

  const rawWidth = Math.max(1, previewBounds.x2 - previewBounds.x1);
  const rawHeight = Math.max(1, previewBounds.y2 - previewBounds.y1);
  const scale = Math.min(
    (options.width - options.padding * 2) / rawWidth,
    (options.height - options.padding * 2) / rawHeight,
  );
  const fontSize = DEFAULT_FONT_SIZE * scale;
  const renderedWidth = rawWidth * scale;
  const renderedHeight = rawHeight * scale;
  const horizontalSlack = Math.max(0, options.width - options.padding * 2 - renderedWidth);
  const verticalSlack = Math.max(0, options.height - options.padding * 2 - renderedHeight);
  const offsetX =
    options.padding + horizontalSlack / 2 - previewBounds.x1 * scale;
  const baseline =
    options.padding + verticalSlack / 2 - previewBounds.y1 * scale;
  const finalGlyphs = layoutGlyphs(font, name, fontSize, offsetX, baseline, unitsPerEm);
  const paths = finalGlyphs.map<SignaturePath>((glyph) => ({
    d: glyph.path.toPathData(2),
    length: 0,
    bounds: {
      x: glyph.bounds.x1,
      y: glyph.bounds.y1,
      width: Math.max(0, glyph.bounds.x2 - glyph.bounds.x1),
      height: Math.max(0, glyph.bounds.y2 - glyph.bounds.y1),
    },
  }));

  return {
    width: options.width,
    height: options.height,
    viewBox: `0 0 ${options.width} ${options.height}`,
    paths,
  };
}

function supportsGlyphLayout(
  font: FontLike,
): font is GlyphCapableFont {
  return (
    typeof font.stringToGlyphs === "function" &&
    typeof font.getKerningValue === "function"
  );
}

function layoutGlyphs(
  font: GlyphCapableFont,
  text: string,
  fontSize: number,
  originX: number,
  baseline: number,
  unitsPerEm: number,
): GlyphLayout[] {
  const glyphs = font.stringToGlyphs(text);
  const scale = fontSize / unitsPerEm;
  let cursorX = originX;
  let previousGlyph: GlyphLike | null = null;

  return glyphs.flatMap((glyph) => {
    if (previousGlyph) {
      cursorX += font.getKerningValue(previousGlyph, glyph) * scale;
    }

    const path = glyph.getPath(cursorX, baseline, fontSize);
    const bounds = path.getBoundingBox();
    const nextCursorX = cursorX + glyph.advanceWidth * scale;
    previousGlyph = glyph;
    cursorX = nextCursorX;

    const pathData = path.toPathData(2).trim();
    if (!pathData) {
      return [];
    }

    return [
      {
        path,
        bounds,
      },
    ];
  });
}

function getAggregateBounds(layouts: GlyphLayout[]): PathBounds | null {
  const firstLayout = layouts[0];
  if (!firstLayout) {
    return null;
  }

  return layouts.slice(1).reduce<PathBounds>(
    (currentBounds, layout) => ({
      x1: Math.min(currentBounds.x1, layout.bounds.x1),
      y1: Math.min(currentBounds.y1, layout.bounds.y1),
      x2: Math.max(currentBounds.x2, layout.bounds.x2),
      y2: Math.max(currentBounds.y2, layout.bounds.y2),
    }),
    { ...firstLayout.bounds },
  );
}

async function loadDefaultFont(): Promise<FontLike> {
  if (cachedFont) {
    return cachedFont;
  }

  const response = await fetch(alluraFontUrl);

  if (!response.ok) {
    throw new Error("Unable to load the signature font asset");
  }

  const fontData = await response.arrayBuffer();
  cachedFont = opentype.parse(fontData) as unknown as FontLike;
  return cachedFont;
}
