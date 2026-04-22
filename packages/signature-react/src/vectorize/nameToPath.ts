import opentype from "opentype.js";
import type { SignatureVector } from "../types";
import caveatFontUrl from "typeface-caveat/files/caveat-latin-700.woff";

export type FontPath = {
  toPathData: (decimalPlaces?: number) => string;
  getBoundingBox: () => {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type FontLike = {
  getPath: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
  ) => FontPath;
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
      },
    ],
  };
}

async function loadDefaultFont(): Promise<FontLike> {
  if (cachedFont) {
    return cachedFont;
  }

  const response = await fetch(caveatFontUrl);

  if (!response.ok) {
    throw new Error("Unable to load the signature font asset");
  }

  const fontData = await response.arrayBuffer();
  cachedFont = opentype.parse(fontData) as FontLike;
  return cachedFont;
}
