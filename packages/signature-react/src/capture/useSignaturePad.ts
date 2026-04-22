import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { SignatureVector, StrokePoint } from "../types";
import { strokeToPath } from "../vectorize/strokeToPath";

export type UseSignaturePadOptions = {
  width: number;
  height: number;
  simplifyTolerance?: number;
  onChange?: (signature: SignatureVector | null) => void;
};

export type UseSignaturePadResult = {
  committedPaths: string[];
  previewPath: string;
  isDrawing: boolean;
  clear: () => void;
  handlePointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
};

/**
 * Manages signature capture state for a freehand SVG drawing surface.
 *
 * @param options Capture sizing and callback configuration.
 * @returns Pointer handlers plus preview and committed stroke state.
 *
 * @example
 * const pad = useSignaturePad({ width: 320, height: 120 });
 * console.log(pad.isDrawing);
 */
export function useSignaturePad(
  options: UseSignaturePadOptions,
): UseSignaturePadResult {
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [activeStroke, setActiveStroke] = useState<StrokePoint[]>([]);

  const committedPaths = useMemo(
    () =>
      strokes
        .map((stroke) =>
          strokeToPath(stroke, {
            simplifyTolerance: options.simplifyTolerance,
          }).d,
        )
        .filter(Boolean),
    [options.simplifyTolerance, strokes],
  );

  const previewPath = useMemo(
    () =>
      strokeToPath(activeStroke, {
        simplifyTolerance: options.simplifyTolerance,
      }).d,
    [activeStroke, options.simplifyTolerance],
  );

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveStroke([toRelativePoint(event, options.width, options.height)]);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>): void {
    if (activeStroke.length === 0) {
      return;
    }

    const nextPoint = toRelativePoint(event, options.width, options.height);
    setActiveStroke((currentStroke) => [
      ...currentStroke,
      nextPoint,
    ]);
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>): void {
    if (activeStroke.length === 0) {
      return;
    }

    const nextPoint = toRelativePoint(event, options.width, options.height);
    const nextStroke = [
      ...activeStroke,
      nextPoint,
    ];
    const nextStrokes = [...strokes, nextStroke];
    const signature = buildSignatureVector(
      nextStrokes,
      options.width,
      options.height,
      options.simplifyTolerance,
    );

    setStrokes(nextStrokes);
    setActiveStroke([]);
    options.onChange?.(signature);
  }

  function clear(): void {
    setStrokes([]);
    setActiveStroke([]);
    options.onChange?.(null);
  }

  return {
    committedPaths,
    previewPath,
    isDrawing: activeStroke.length > 0,
    clear,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

function buildSignatureVector(
  strokes: StrokePoint[][],
  width: number,
  height: number,
  simplifyTolerance?: number,
): SignatureVector {
  return {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    paths: strokes.map((stroke) =>
      strokeToPath(stroke, {
        simplifyTolerance,
      }),
    ),
  };
}

function toRelativePoint(
  event: ReactPointerEvent<SVGSVGElement>,
  width: number,
  height: number,
): StrokePoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * width;
  const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * height;

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    time: Date.now(),
  };
}
