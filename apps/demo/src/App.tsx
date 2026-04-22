import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SignaturePadCard,
  TypedSignatureCard,
  type SignatureVector,
} from "@signature/react";
import { UseCaseDialog, type UseCaseDetails } from "./UseCaseDialog";
import "./styles.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DRAWN_TRACE_DURATION_MS = 3600;
const TYPED_TRACE_DURATION_MS = 3400;

const DRAWN_FEATURED: SignatureVector = {
  width: 420,
  height: 160,
  viewBox: "0 0 420 160",
  paths: [
    {
      d: "M 30 118 C 34 70 38 44 54 36 C 68 30 70 62 60 90 C 54 108 46 120 50 108 C 54 92 70 62 90 44 C 108 28 120 42 114 68 C 110 86 100 102 96 116 C 94 126 104 108 122 84 C 142 58 164 52 166 72 C 166 92 150 104 140 96 C 134 90 150 78 170 78 C 188 78 198 90 200 104 C 202 116 210 108 226 92 C 244 74 258 64 264 82 C 268 98 256 108 248 100 C 242 94 256 82 274 80 C 296 78 312 96 312 112 C 312 124 300 126 294 116 C 290 108 302 102 318 104 C 340 108 358 128 348 132 C 340 134 330 120 340 112",
      length: 0,
    },
    {
      d: "M 40 140 C 120 156 280 154 372 136",
      length: 0,
    },
  ],
};

const TYPED_FEATURED_FALLBACK: SignatureVector = {
  width: 420,
  height: 160,
  viewBox: "0 0 420 160",
  paths: [
    {
      d: "M 32 104 C 36 70 50 62 62 84 C 68 98 60 114 56 110 C 52 106 62 86 82 82 C 102 78 114 92 106 102 C 100 110 106 94 128 88 C 150 82 162 96 152 106 C 146 112 156 96 180 90 C 204 84 216 96 208 106 C 202 112 214 96 238 90 C 262 84 276 96 266 106 C 260 112 270 98 292 92 C 316 86 330 100 322 112 C 316 118 324 100 342 96 C 360 92 372 102 368 114",
      length: 0,
    },
  ],
};

function buildSignatureSvg(
  signature: SignatureVector,
  filled: boolean,
): string {
  const strokeWidth = 3.6;
  const inner = signature.paths
    .map((path) =>
      filled
        ? `<path d="${path.d}" fill="#111111"/>`
        : `<path d="${path.d}" fill="none" stroke="#111111" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${signature.viewBox}" width="${signature.width}" height="${signature.height}">${inner}</svg>`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportSignatureSvg(
  signature: SignatureVector,
  filled: boolean,
  filename: string,
): void {
  const svg = buildSignatureSvg(signature, filled);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

async function exportSignaturePng(
  signature: SignatureVector,
  filled: boolean,
  filename: string,
): Promise<void> {
  const svg = buildSignatureSvg(signature, filled);
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(signature.width * scale);
  canvas.height = Math.round(signature.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render signature image"));
      image.src = url;
    });

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, filename);
        }
        resolve();
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

type UseCaseIconKind =
  | "signature"
  | "contract"
  | "shield"
  | "certificate"
  | "receipt"
  | "monogram";

type UseCaseCard = {
  id: string;
  title: string;
  copy: string;
  badge: string;
  icon: UseCaseIconKind;
  isFeatured?: boolean;
  spanClass: string;
  extras?: string[];
  details?: UseCaseDetails;
};

const useCases: UseCaseCard[] = [
  {
    id: "signature",
    title: "Signature trace",
    copy: "Turn a typed name or hand-drawn mark into a replayable SVG signature that feels like a signing ceremony.",
    badge: "Available now",
    icon: "signature",
    isFeatured: true,
    spanClass: "card-span-8",
  },
  {
    id: "contract",
    title: "Contract signing",
    copy: "MSAs, services agreements, and SOWs that replay the signer's name as the page locks in.",
    badge: "Use case",
    icon: "contract",
    spanClass: "card-span-4 card-tall",
    extras: ["MSAs", "Services agreements", "SOWs", "Partnership letters"],
    details: {
      lede: "A calm, 0.9-second trace takes the place of the usual checkbox — the signer's name lands like a fountain pen touching paper, and the page locks in with quiet ceremony.",
      tags: ["MSA", "SOW", "Services", "Partnership"],
      sections: [
        {
          heading: "What it replaces",
          body: "Transactional 'Signed by' stamps, static confirmation modals, and the abrupt toast that usually celebrates a million-dollar agreement.",
        },
        {
          heading: "How it feels",
          body: "Ink flows in from the first stroke, the signature settles onto the rule, the page dims, and a seal fades into the margin. The ceremony matches the weight of the commitment.",
        },
        {
          heading: "Best for",
          body: "Master services agreements, statements of work, partnership letters, employment contracts, and anything a legal team reviews twice before sending.",
        },
      ],
      demoKind: "contract",
    },
  },
  {
    id: "nda",
    title: "NDA ceremony",
    copy: "A measured trace for confidentiality documents where the motion is calm and deliberate.",
    badge: "Use case",
    icon: "shield",
    spanClass: "card-span-4",
    details: {
      lede: "A slower, more deliberate pace for agreements built on trust. The stroke settles into the margin like a quiet confirmation instead of a stamp.",
      tags: ["Mutual", "One-way", "Disclosure", "Investor"],
      sections: [
        {
          heading: "Pace",
          body: "A 1.2-second trace with a softer entry — the motion itself signals gravity before the signer lifts their hand.",
        },
        {
          heading: "Typography",
          body: "Pairs the typed cursive with a margin seal and a counter-signature placeholder so a second party's mark can settle in beside the first.",
        },
        {
          heading: "Best for",
          body: "Mutual and one-way NDAs, employee confidentiality agreements, investor disclosure packets, and vendor access letters.",
        },
      ],
      demoKind: "nda",
    },
  },
  {
    id: "certificate",
    title: "Certificate seal",
    copy: "Diplomas, course completions, and professional credentials closed with a formal flourish.",
    badge: "Use case",
    icon: "certificate",
    spanClass: "card-span-4",
    details: {
      lede: "A formal close for achievement artifacts. The recipient's name arrives in cursive, followed by a seal that settles into the lower third of the page.",
      tags: ["Diplomas", "Credentials", "Awards", "Badges"],
      sections: [
        {
          heading: "Composition",
          body: "Serif title, cursive recipient name, a hairline rule, and a rosette seal that scales in with a soft spring after the signature finishes.",
        },
        {
          heading: "Export",
          body: "Ships as SVG (editorial print) and PNG at 3× density so it lives well in digital credentials and printed portfolios alike.",
        },
        {
          heading: "Best for",
          body: "Course completions, professional certifications, cohort alumni awards, and brand-led credential programs.",
        },
      ],
      demoKind: "certificate",
    },
  },
  {
    id: "receipt",
    title: "Receipt flourish",
    copy: "Premium invoices and printed receipts finished with an editorial signature pass.",
    badge: "Use case",
    icon: "receipt",
    spanClass: "card-span-4",
    details: {
      lede: "Receipts don't have to feel like system output. A short flourish under the total turns a transaction into a handoff.",
      tags: ["Invoices", "Receipts", "Statements"],
      sections: [
        {
          heading: "Motion",
          body: "A compressed 0.6-second trace under the total line — fast enough for everyday transactions, considered enough to feel intentional.",
        },
        {
          heading: "Integration",
          body: "Drop it over existing invoice templates without touching the layout; the signature renders above the document as an SVG overlay.",
        },
        {
          heading: "Best for",
          body: "Premium invoices, subscription statements, hospitality receipts, and any document that says 'thank you' at the bottom.",
        },
      ],
      demoKind: "receipt",
    },
  },
  {
    id: "monogram",
    title: "Artist monogram",
    copy: "Layered initials that open with a soft flourish and settle into a crest — perfect for artwork and brand marks.",
    badge: "In design",
    icon: "monogram",
    spanClass: "card-span-12 card-wide",
    details: {
      lede: "A motion study still on the easel. Two initials arrive in sequence and settle into a crest, giving personal brands a signing-quality mark.",
      tags: ["Crest", "Initials", "Brand mark"],
      sections: [
        {
          heading: "Concept",
          body: "The first initial anchors; the second leans into the first with a counter-weighted curve, then a hairline circle closes the composition.",
        },
        {
          heading: "Status",
          body: "Design-in-progress — the base pair is locked and we're tuning the ligature spacing and the entry easing.",
        },
        {
          heading: "Coming to",
          body: "Portfolio footers, product packaging, artist statements, and email signatures that want to feel like a maker's mark.",
        },
      ],
      demoKind: "monogram",
    },
  },
];

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v12" />
      <path d="M6 12l6 6 6-6" />
      <path d="M4 20h16" />
    </svg>
  );
}

function UseCaseIcon({ kind }: { kind: UseCaseIconKind }) {
  const baseProps = {
    width: 56,
    height: 56,
    viewBox: "0 0 56 56",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.35,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "signature":
      return (
        <svg {...baseProps}>
          <path d="M8 36c4-14 10-16 14-6s8 10 12-2s10-10 14 2" />
          <path d="M10 44h34" />
        </svg>
      );
    case "contract":
      return (
        <svg {...baseProps}>
          <rect x="12" y="6" width="30" height="44" rx="3" />
          <path d="M18 16h18M18 22h18M18 28h12" />
          <path d="M20 40c3-3 7-3 10 0c2 1 5 1 7-1" />
        </svg>
      );
    case "shield":
      return (
        <svg {...baseProps}>
          <path d="M28 6L44 12v12c0 12-7 20-16 24c-9-4-16-12-16-24V12L28 6z" />
          <rect x="23" y="23" width="10" height="10" rx="1.5" />
          <path d="M25 23v-3a3 3 0 016 0v3" />
        </svg>
      );
    case "certificate":
      return (
        <svg {...baseProps}>
          <circle cx="28" cy="22" r="12" />
          <circle cx="28" cy="22" r="6.5" strokeDasharray="2 2" />
          <path d="M20 33l-3 15l11-6l11 6l-3-15" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...baseProps}>
          <path d="M12 6h32v40l-5-3l-5 3l-5-3l-5 3l-5-3l-5 3l-2-1z" />
          <path d="M18 16h20M18 22h20M18 28h14" />
          <path d="M20 36h16" />
        </svg>
      );
    case "monogram":
      return (
        <svg {...baseProps}>
          <path d="M10 44V12l10 20l10-20v32" />
          <path d="M30 44c5-7 10-12 16-18" />
          <path d="M36 20c4 4 7 4 10 1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function App() {
  const shouldAnimate = !import.meta.env.TEST;
  const shellRef = useRef<HTMLElement>(null);
  const studioRef = useRef<HTMLElement>(null);
  const pendingScrollRef = useRef(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"draw" | "type">("draw");
  const [studioRestartToken, setStudioRestartToken] = useState(0);
  const featuredMode = activeMode;
  const featuredSignature =
    featuredMode === "draw" ? DRAWN_FEATURED : TYPED_FEATURED_FALLBACK;
  const featuredIsFilled = featuredMode === "type";
  const featuredTitle =
    featuredMode === "draw" ? "Drawn signature trace" : "Typed signature trace";
  const featuredFileStem =
    featuredMode === "draw"
      ? "motion-signatures-drawn"
      : "motion-signatures-typed";
  const handleDownloadSvg = () => {
    exportSignatureSvg(
      featuredSignature,
      featuredIsFilled,
      `${featuredFileStem}.svg`,
    );
  };

  const handleDownloadPng = () => {
    void exportSignaturePng(
      featuredSignature,
      featuredIsFilled,
      `${featuredFileStem}.png`,
    );
  };

  const [activeUseCaseId, setActiveUseCaseId] = useState<string | null>(null);
  const activeUseCase = activeUseCaseId
    ? (useCases.find((card) => card.id === activeUseCaseId) ?? null)
    : null;
  const handleOpenUseCase = (id: string) => {
    setActiveUseCaseId(id);
  };
  const handleCloseUseCase = () => {
    setActiveUseCaseId(null);
  };
  const handleUseCaseOpenStudio = () => {
    setActiveUseCaseId(null);
    openStudio(activeMode, { scroll: true });
  };

  useGSAP(
    () => {
      if (!shouldAnimate) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          duration: 0.9,
          ease: "power3.out",
        },
      });

      timeline
        .from("[data-nav-pill]", {
          y: -28,
          opacity: 0,
        })
        .from(
          "[data-hero-copy] > *",
          {
            y: 36,
            opacity: 0,
            stagger: 0.08,
          },
          "-=0.45",
        )
        .from(
          "[data-preview-pane]",
          {
            y: 40,
            opacity: 0,
            scale: 0.96,
          },
          "-=0.55",
        )
        .from(
          "[data-gallery-card]",
          {
            y: 48,
            opacity: 0,
            stagger: 0.08,
          },
          "-=0.45",
        )
        .to(
          "[data-hero-inline-toggle]",
          {
            y: -4,
            repeat: -1,
            yoyo: true,
            duration: 1.25,
            ease: "sine.inOut",
          },
          0.25,
        );
    },
    { scope: shellRef },
  );

  useGSAP(
    () => {
      if (!shouldAnimate) {
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: "bottom 10%",
        scrub: 0.6,
        animation: gsap
          .timeline()
          .to(
            "[data-preview-pane]",
            {
              yPercent: -32,
              rotate: -4,
              scale: 0.86,
              ease: "none",
            },
            0,
          )
          .to(
            "[data-hero-copy]",
            {
              yPercent: -8,
              ease: "none",
            },
            0,
          ),
      });

      return () => {
        trigger.kill();
      };
    },
    { scope: shellRef, dependencies: [shouldAnimate] },
  );

  useGSAP(
    () => {
      if (!shouldAnimate || !isStudioOpen || !studioRef.current) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .fromTo(
          studioRef.current,
          {
            opacity: 0,
            y: 48,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
          },
        )
        .from(
          "[data-studio-tab]",
          {
            y: 18,
            opacity: 0,
            stagger: 0.07,
            duration: 0.45,
          },
          "-=0.4",
        );
    },
    {
      scope: shellRef,
      dependencies: [isStudioOpen, studioRestartToken],
      revertOnUpdate: true,
    },
  );

  function openStudio(
    nextMode: "draw" | "type" = activeMode,
    options: { scroll?: boolean } = {},
  ): void {
    if (options.scroll) {
      pendingScrollRef.current = true;
    }
    setActiveMode(nextMode);
    setIsStudioOpen(true);
    setStudioRestartToken((currentValue) => currentValue + 1);
  }

  function toggleFeaturedMode(): void {
    const nextMode = activeMode === "draw" ? "type" : "draw";

    if (isStudioOpen) {
      openStudio(nextMode);
      return;
    }

    setActiveMode(nextMode);
  }

  useEffect(() => {
    if (!isStudioOpen || !pendingScrollRef.current) {
      return;
    }

    const target = studioRef.current;
    pendingScrollRef.current = false;

    if (!target || typeof target.scrollIntoView !== "function") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isStudioOpen, studioRestartToken]);

  return (
    <>
    <main className="demo-shell" ref={shellRef}>
      <nav className="nav-wrap">
        <div className="nav-pill" data-nav-pill="">
          <a className="brand-lockup" href="#top" aria-label="Motion signatures home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 16c2-7 4-8 6-3s4 5 6-2s4-5 6 2" />
              </svg>
            </span>
            <span className="brand-wordmark">
              <span className="brand-primary">motion</span>
              <span className="brand-slash">/</span>
              <span className="brand-secondary">signatures</span>
            </span>
          </a>
          <div className="nav-links">
            <a href="#library">Library</a>
            <a href="#studio">Studio</a>
            <a
              className="nav-cta"
              href="https://github.com/nachoestevo"
              rel="noreferrer"
              target="_blank"
            >
              Github
            </a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy" data-hero-copy="">
          <p className="eyebrow">Clean motion for signing moments</p>
          <h1 aria-label="Signature motion for documents that deserve craft.">
            Signature motion{" "}
            <button
              aria-label={
                activeMode === "draw"
                  ? "Switch featured mode to typed"
                  : "Switch featured mode to drawn"
              }
              className={`hero-inline-toggle ${activeMode === "draw" ? "hero-inline-toggle-drawn" : "hero-inline-toggle-typed"}`}
              data-hero-inline-toggle=""
              onClick={toggleFeaturedMode}
              type="button"
            >
              {activeMode === "draw" ? "drawn" : "typed"}
            </button>{" "}
            for documents that deserve craft.
          </h1>
          <p className="hero-text">
            Design your signing surface like a product moment, not a utility field.
            This first study captures a name or freehand signature, converts it into
            SVG, and replays the stroke with a calm, premium trace.
          </p>
          <div className="hero-actions">
            <button
              className="button-primary hero-cta"
              onClick={() => openStudio(activeMode, { scroll: true })}
              type="button"
            >
              <span className="hero-cta-label">Enter the studio</span>
              <span className="hero-cta-icon" aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="preview-pane" data-preview-pane="">
          <article
            className="contract-card"
            aria-label={`${featuredTitle} contract preview`}
          >
            <span className="contract-seal" aria-hidden="true">
              Motion
              <br />
              Signed
            </span>
            <header className="contract-head">
              <p className="contract-eyebrow">Motion Signatures · Article I</p>
              <h2 className="contract-title">Ceremonial Agreement</h2>
              <p className="contract-stamp">{featuredTitle}</p>
            </header>
            <div className="contract-body">
              <p>
                Between the undersigned and Motion Signatures Co., this letter
                witnesses the faithful recording of a mark and its replay as an
                SVG trace.
              </p>
              <ul className="contract-lines" aria-hidden="true">
                <li />
                <li />
                <li />
              </ul>
            </div>
            <div className="contract-sign">
              <div className="contract-sign-surface">
                <svg
                  viewBox={featuredSignature.viewBox}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {featuredSignature.paths.map((path) => (
                    <path
                      key={path.d}
                      d={path.d}
                      fill={featuredIsFilled ? "#111111" : "none"}
                      stroke={featuredIsFilled ? "none" : "#111111"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={featuredIsFilled ? undefined : 3.6}
                    />
                  ))}
                </svg>
              </div>
              <div className="contract-sign-meta">
                <span className="contract-sign-label">Signed</span>
                <span className="contract-sign-date">April 22, 2026</span>
              </div>
            </div>
            <footer className="contract-actions">
              <p className="contract-actions-label">
                Export the mark for your document flow.
              </p>
              <div className="contract-actions-row">
                <button
                  className="contract-action-button"
                  onClick={handleDownloadSvg}
                  type="button"
                >
                  <DownloadIcon />
                  Download SVG
                </button>
                <button
                  className="contract-action-button"
                  onClick={handleDownloadPng}
                  type="button"
                >
                  <DownloadIcon />
                  Download PNG
                </button>
              </div>
            </footer>
          </article>
        </div>
      </section>

      <section className="library-section" id="library">
        <div className="section-intro">
          <p className="flow-label">Motion library</p>
          <h2>Built for the documents that deserve a ceremony.</h2>
          <p>
            Each card is a use case for the same underlying trace engine. Start with
            freehand or typed signatures today, and extend the library as new
            signing moments ship.
          </p>
        </div>

        <div className="use-case-grid">
          {useCases.map((card) => (
            <article
              className={`use-case-card ${card.spanClass} ${card.isFeatured ? "use-case-card-featured" : ""}`}
              data-gallery-card=""
              key={card.id}
            >
              <header className="use-case-head">
                <span
                  className={`use-case-badge ${card.isFeatured ? "use-case-badge-active" : ""}`}
                >
                  {card.badge}
                </span>
                {!card.isFeatured ? (
                  <span aria-hidden="true" className="use-case-icon">
                    <UseCaseIcon kind={card.icon} />
                  </span>
                ) : null}
              </header>

              <div className="use-case-body">
                <h3>{card.isFeatured ? featuredTitle : card.title}</h3>
                <p>{card.copy}</p>
                {card.extras ? (
                  <ul className="use-case-extras">
                    {card.extras.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {card.isFeatured ? (
                <div className="use-case-featured-preview">
                  <svg
                    preserveAspectRatio="xMidYMid meet"
                    viewBox={featuredSignature.viewBox}
                  >
                    {featuredSignature.paths.map((path) => (
                      <path
                        d={path.d}
                        fill={featuredIsFilled ? "#111111" : "none"}
                        key={`${card.id}-${path.d}`}
                        stroke={featuredIsFilled ? "none" : "#111111"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={featuredIsFilled ? undefined : 3.2}
                      />
                    ))}
                  </svg>
                  <button
                    aria-expanded={isStudioOpen}
                    className="button-primary use-case-cta"
                    onClick={() => openStudio(activeMode, { scroll: true })}
                    type="button"
                  >
                    Open signature trace studio
                  </button>
                </div>
              ) : card.details ? (
                <footer className="use-case-foot">
                  <button
                    aria-label={`Learn more about ${card.title}`}
                    className="use-case-link"
                    onClick={() => handleOpenUseCase(card.id)}
                    type="button"
                  >
                    {card.badge === "In design"
                      ? "Preview the study"
                      : "Learn more"}
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </footer>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {isStudioOpen ? (
        <section className="studio-shell" id="studio" ref={studioRef}>
          <div className="studio-head">
            <div>
              <p className="flow-label">Expanded interaction</p>
              <h2>Signature trace studio</h2>
              <p>
                Switch modes, replay from the start, and focus only on the active
                signature experience.
              </p>
            </div>
            <button
              className="button-secondary"
              onClick={() => setIsStudioOpen(false)}
              type="button"
            >
              Collapse studio
            </button>
          </div>

          <div className="studio-tabs">
            <button
              className={`studio-tab ${activeMode === "draw" ? "studio-tab-active" : ""}`}
              data-studio-tab=""
              onClick={() => openStudio("draw")}
              type="button"
            >
              Draw by hand
            </button>
            <button
              className={`studio-tab ${activeMode === "type" ? "studio-tab-active" : ""}`}
              data-studio-tab=""
              onClick={() => openStudio("type")}
              type="button"
            >
              Type to generate
            </button>
          </div>

          <div className="studio-canvas">
            {activeMode === "draw" ? (
              <SignaturePadCard
                durationMs={DRAWN_TRACE_DURATION_MS}
                height={220}
                restartToken={studioRestartToken}
                simplifyTolerance={2.4}
                width={560}
              />
            ) : (
              <TypedSignatureCard
                durationMs={TYPED_TRACE_DURATION_MS}
                restartToken={studioRestartToken}
              />
            )}
          </div>
        </section>
      ) : null}
    </main>

      <footer className="site-footer" data-footer-panel="" id="launch">
        <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <div className="footer-mark">
              <span className="footer-wordmark">
                <span className="footer-brand-primary">motion</span>
                <span className="footer-brand-slash">/</span>
                <span className="footer-brand-secondary">signatures</span>
              </span>
            </div>
            <p className="footer-tagline">
              A growing library of premium motion studies for signing moments,
              document ceremonies, and the craft details that make a product
              feel intentional.
            </p>
            <a
              className="footer-author"
              href="https://nachoestevo.com"
              rel="noreferrer"
              target="_blank"
            >
              <span>
                Crafted by <strong>Nacho Estevo</strong>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </a>
          </div>

          <div className="site-footer-links">
            <div className="footer-column">
              <p className="footer-heading">Library</p>
              <a href="#library">All motion studies</a>
              <a href="#studio">Signature studio</a>
              <a href="#top">Overview</a>
            </div>
            <div className="footer-column">
              <p className="footer-heading">Resources</p>
              <a
                href="https://github.com/nachoestevo/motion-signatures"
                rel="noreferrer"
                target="_blank"
              >
                Source on Github
              </a>
              <a
                href="https://github.com/nachoestevo/motion-signatures/releases"
                rel="noreferrer"
                target="_blank"
              >
                Changelog
              </a>
            </div>
            <div className="footer-column">
              <p className="footer-heading">Connect</p>
              <a
                href="https://github.com/nachoestevo"
                rel="noreferrer"
                target="_blank"
              >
                @nachoestevo
              </a>
              <a href="#top">Back to top</a>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p aria-hidden="true" className="site-footer-name">
            motion/signatures
          </p>
          <div className="site-footer-meta">
            <span>© 2026 Nacho Estevo</span>
            <span aria-hidden="true" className="site-footer-meta-sep">
              ·
            </span>
            <span>MIT License</span>
          </div>
        </div>
        </div>
      </footer>

      {activeUseCase?.details ? (
        <UseCaseDialog
          badge={activeUseCase.badge}
          details={activeUseCase.details}
          onClose={handleCloseUseCase}
          onOpenStudio={handleUseCaseOpenStudio}
          shouldAnimate={shouldAnimate}
          title={activeUseCase.title}
        />
      ) : null}
    </>
  );
}
