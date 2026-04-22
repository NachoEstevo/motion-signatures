<div align="center">

# motion / signatures

### A React-first motion library for signing moments.

Capture a name or a freehand mark, vectorize it to SVG,
and replay the stroke with a calm, premium trace.

[Live demo](#run-the-demo) · [Library](#use-the-library) · [Architecture](#architecture) · [Roadmap](#roadmap)

</div>

---

## Why

Most signing UIs treat the signature as a utility field. It deserves a moment.
`motion/signatures` turns a name or a finger-drawn mark into a vector and replays
the stroke like ink landing on paper — sequenced, eased, and framed inside a
card you'd ship to production.

- **React-first.** Every surface is a real component with a clean prop API.
- **SVG the whole way down.** No canvas recordings, no bitmap shortcuts.
- **Two capture modes.** Typed names (via OpenType glyph vectorization) and
  freehand pointer input (with stroke smoothing + cubic Bézier fitting).
- **Two playback modes.** Dash-offset trace for line art, left-to-right
  clip-reveal for filled glyphs.
- **GSAP-driven motion.** Explicit timelines, no guessing at easing curves.
- **Exportable.** Drop the resulting SVG or a 3× PNG into any document flow.

## Run the demo

```bash
npm install
npm run dev:demo
```

Open the URL Vite prints. The demo showcases the hero, the expanded studio,
and a gallery of use cases (contracts, NDAs, certificates, receipts, monograms)
with animated modal explorations of each.

## Use the library

Install the workspace package (or consume it directly from this repo):

```bash
npm install @signature/react gsap react react-dom
```

### Typed signature from a name

```tsx
import { TypedSignatureCard } from "@signature/react";

export function NameTrace() {
  return <TypedSignatureCard durationMs={1800} />;
}
```

Under the hood this loads a cursive typeface, asks OpenType.js for the glyph
path of the typed name, normalizes it into a `viewBox`, then reveals it with
a left-to-right clip-path sweep using `power2.out`.

### Freehand signature from a finger or stylus

```tsx
import { SignaturePadCard } from "@signature/react";

export function DrawnTrace() {
  return (
    <SignaturePadCard
      width={560}
      height={220}
      simplifyTolerance={2.4}
      durationMs={2300}
    />
  );
}
```

Pointer input is captured, smoothed, and fit into cubic Bézier segments via
`strokeToPath()`. The resulting path is then measured with
`svg-path-properties` and animated with per-segment dash offsets.

### Compose your own surface

The high-level cards are made of smaller primitives you can wire up yourself:

```tsx
import {
  SignaturePad,
  SignatureNameField,
  AnimatedSignatureCard,
  nameToPath,
  strokeToPath,
  getPathMetrics,
} from "@signature/react";
```

| Export                  | What it does                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `SignaturePad`          | Low-level pointer capture surface that emits a `SignatureVector`.                                 |
| `SignatureNameField`    | Typed-name field that calls `nameToPath()` and emits a `SignatureVector`.                         |
| `AnimatedSignatureCard` | Preview card that plays back a `SignatureVector` in either `stroke` or `fill` render mode.        |
| `SignaturePadCard`      | Opinionated drawn-signature flow: pad + animated preview.                                         |
| `TypedSignatureCard`    | Opinionated typed-signature flow: name field + animated preview.                                  |
| `strokeToPath()`        | Converts smoothed pointer points into an SVG cubic Bézier path.                                   |
| `nameToPath()`          | Converts a typed string into a filled-glyph `SignatureVector` sized to a normalized viewBox.      |
| `getPathMetrics()`      | Measures one or more path strings and returns normalized `start`/`end` windows for timeline cues. |

## Architecture

```
┌──────────────┐      ┌───────────────────┐      ┌────────────────────────┐
│  Input       │ ───▶ │  Vectorization    │ ───▶ │  Animation             │
│              │      │                   │      │                        │
│  SignaturePad│      │ strokeToPath()    │      │ getPathMetrics()       │
│  NameField   │      │ nameToPath()      │      │ GSAP timeline per seg. │
└──────────────┘      └───────────────────┘      └────────────────────────┘
                                                            │
                                                            ▼
                                                 ┌────────────────────────┐
                                                 │  AnimatedSignatureCard │
                                                 │    stroke mode: dash   │
                                                 │    fill mode: clipPath │
                                                 └────────────────────────┘
```

Two replay strategies live inside a single card component so the same
preview surface works for both capture modes:

- **`renderMode="stroke"`** — animates `strokeDasharray` / `strokeDashoffset`
  per segment, sequenced by a GSAP timeline keyed off the normalized metric
  windows from `getPathMetrics()`.
- **`renderMode="fill"`** — renders the glyph outlines as filled shapes and
  sweeps a clipping `<rect>` from `0` to viewBox width via GSAP's `attr`
  plugin, so typed names feel like they're being written in rather than
  having their outlines traced.

## Monorepo layout

```
.
├── apps/
│   └── demo/                 Vite showcase (the motion/signatures site)
└── packages/
    └── signature-react/      The reusable React package (@signature/react)
```

## Scripts

| Command               | What it does                                               |
| --------------------- | ---------------------------------------------------------- |
| `npm install`         | Install the workspace.                                     |
| `npm run dev:demo`    | Start the Vite demo in watch mode.                         |
| `npm test`            | Run the full Vitest suite across packages and the demo.    |
| `npm run test:watch`  | Same, but watching for changes.                            |
| `npm run typecheck`   | `tsc --noEmit` across the workspace.                       |
| `npm run lint`        | ESLint across packages and apps.                           |
| `npm run build`       | Build every workspace package that exposes a build script. |

## Quality bar

- **TDD where it counts.** Vectorization, metric computation, and every
  component ship with focused unit / integration tests.
- **Strict TypeScript.** Component props and vector types are exported so you
  can compose without guessing shapes.
- **Deterministic motion.** GSAP timelines replace CSS keyframes so the
  replay starts from the first stroke every time, including after a mode
  switch or restart.
- **Accessibility.** Dialogs trap focus, close on `Escape`, and expose
  `role="dialog"` with labelled titles. Controls are reachable via keyboard.

## Roadmap

- [x] Signature trace (typed + drawn)
- [x] Contract, NDA, certificate, receipt and monogram use-case studies
- [x] SVG and 3× PNG export
- [ ] Motion study: onboarding checkmarks and confirmation ticks
- [ ] Motion study: expressive toast and success moments
- [ ] Motion study: document seals and watermarks
- [ ] Publish `@signature/react` to npm

Suggestions welcome — open an issue on the
[repo](https://github.com/nachoestevo/motion-signatures).

## Built with

- [React 19](https://react.dev)
- [GSAP](https://gsap.com) + [@gsap/react](https://gsap.com/resources/React)
- [opentype.js](https://opentype.js.org/) and the Caveat typeface
- [svg-path-properties](https://github.com/rveciana/svg-path-properties)
- [Vite](https://vitejs.dev), [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com)
- [TypeScript](https://www.typescriptlang.org), [ESLint](https://eslint.org), [tsup](https://tsup.egoist.dev)

## License

MIT © [Nacho Estevo](https://github.com/nachoestevo)
