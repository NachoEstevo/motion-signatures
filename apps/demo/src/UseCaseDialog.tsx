import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type UseCaseDemoKind =
  | "contract"
  | "nda"
  | "certificate"
  | "receipt"
  | "monogram";

export type UseCaseDetails = {
  lede: string;
  tags: string[];
  sections: Array<{ heading: string; body: string }>;
  demoKind: UseCaseDemoKind;
};

export type UseCaseDialogProps = {
  title: string;
  badge: string;
  details: UseCaseDetails;
  shouldAnimate: boolean;
  onClose: () => void;
  onOpenStudio?: () => void;
};

export function UseCaseDialog({
  title,
  badge,
  details,
  shouldAnimate,
  onClose,
  onOpenStudio,
}: UseCaseDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const ledeId = useId();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  useGSAP(
    () => {
      if (!shouldAnimate) {
        return;
      }

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.32, ease: "power2.out" },
      );
      gsap.fromTo(
        dialogRef.current,
        { opacity: 0, y: 28, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          delay: 0.05,
        },
      );
    },
    { dependencies: [shouldAnimate] },
  );

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      aria-hidden="false"
      className="use-case-dialog-overlay"
      data-use-case-dialog-overlay=""
      onClick={handleOverlayClick}
      ref={overlayRef}
    >
      <div
        aria-describedby={ledeId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="use-case-dialog"
        data-use-case-dialog=""
        ref={dialogRef}
        role="dialog"
      >
        <header className="use-case-dialog-head">
          <span className="use-case-dialog-badge">{badge}</span>
          <button
            aria-label="Close dialog"
            className="use-case-dialog-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <h2 className="use-case-dialog-title" id={titleId}>
          {title}
        </h2>
        <p className="use-case-dialog-lede" id={ledeId}>
          {details.lede}
        </p>

        <div aria-hidden="true" className="use-case-dialog-demo">
          <UseCaseDemo kind={details.demoKind} />
        </div>

        <dl className="use-case-dialog-sections">
          {details.sections.map((section) => (
            <div className="use-case-dialog-section" key={section.heading}>
              <dt>{section.heading}</dt>
              <dd>{section.body}</dd>
            </div>
          ))}
        </dl>

        <footer className="use-case-dialog-foot">
          <div className="use-case-dialog-tags">
            {details.tags.map((tag) => (
              <span className="use-case-dialog-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {onOpenStudio ? (
            <button
              className="button-primary use-case-dialog-cta"
              onClick={onOpenStudio}
              type="button"
            >
              Try it in the studio
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function UseCaseDemo({ kind }: { kind: UseCaseDemoKind }) {
  switch (kind) {
    case "contract":
      return (
        <svg
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          viewBox="0 0 360 200"
        >
          <rect
            fill="#fbf7ee"
            height="192"
            rx="14"
            stroke="rgba(17,17,17,0.16)"
            width="260"
            x="50"
            y="4"
          />
          <rect
            fill="rgba(17,17,17,0.06)"
            height="12"
            rx="3"
            width="90"
            x="70"
            y="24"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="4"
            rx="2"
            width="220"
            x="70"
            y="50"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="4"
            rx="2"
            width="220"
            x="70"
            y="62"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="4"
            rx="2"
            width="160"
            x="70"
            y="74"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="4"
            rx="2"
            width="200"
            x="70"
            y="94"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="4"
            rx="2"
            width="140"
            x="70"
            y="106"
          />
          <line
            stroke="rgba(17,17,17,0.5)"
            strokeLinecap="round"
            strokeWidth="1"
            x1="72"
            x2="288"
            y1="168"
            y2="168"
          />
          <text
            fill="rgba(17,17,17,0.45)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="7"
            fontWeight="700"
            letterSpacing="2"
            x="72"
            y="182"
          >
            SIGNATURE
          </text>
          <path
            d="M 82 160 C 96 118 108 110 118 138 C 126 160 108 166 106 150 C 104 138 130 126 154 136 C 172 144 176 158 170 160 C 162 162 180 138 208 136 C 238 134 252 152 244 160 C 238 164 252 146 276 148"
            fill="none"
            stroke="#111111"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      );
    case "nda":
      return (
        <svg
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          viewBox="0 0 360 200"
        >
          <path
            d="M70 18 H254 L290 54 V184 H70 Z"
            fill="#fbf7ee"
            stroke="rgba(17,17,17,0.2)"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
          <path
            d="M254 18 V54 H290"
            fill="rgba(17,17,17,0.05)"
            stroke="rgba(17,17,17,0.2)"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
          <text
            fill="rgba(17,17,17,0.55)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="8"
            fontWeight="700"
            letterSpacing="3"
            x="90"
            y="42"
          >
            CONFIDENTIAL · MUTUAL NDA
          </text>
          <rect
            fill="rgba(17,17,17,0.12)"
            height="3"
            rx="1.5"
            width="170"
            x="90"
            y="58"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="3"
            rx="1.5"
            width="180"
            x="90"
            y="68"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="3"
            rx="1.5"
            width="140"
            x="90"
            y="78"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="3"
            rx="1.5"
            width="170"
            x="90"
            y="94"
          />
          <rect
            fill="rgba(17,17,17,0.1)"
            height="3"
            rx="1.5"
            width="120"
            x="90"
            y="104"
          />
          <g transform="translate(242 144)">
            <circle
              cx="0"
              cy="0"
              fill="rgba(17,17,17,0.04)"
              r="22"
              stroke="rgba(17,17,17,0.32)"
              strokeWidth="1.2"
            />
            <circle
              cx="0"
              cy="0"
              fill="none"
              r="15"
              stroke="rgba(17,17,17,0.24)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
            <rect
              fill="none"
              height="9"
              rx="1.5"
              stroke="rgba(17,17,17,0.6)"
              strokeWidth="1.2"
              width="12"
              x="-6"
              y="-2"
            />
            <path
              d="M-4 -2 v-3 a4 4 0 018 0 v3"
              fill="none"
              stroke="rgba(17,17,17,0.6)"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
          </g>
          <line
            stroke="rgba(17,17,17,0.45)"
            strokeLinecap="round"
            x1="90"
            x2="206"
            y1="160"
            y2="160"
          />
          <text
            fill="rgba(17,17,17,0.55)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="7"
            fontWeight="700"
            letterSpacing="2"
            x="90"
            y="174"
          >
            SIGNED
          </text>
          <path
            d="M 94 156 C 104 140 118 142 128 152 C 138 160 154 146 168 150 C 180 154 190 148 202 154"
            fill="none"
            stroke="#111111"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      );
    case "certificate":
      return (
        <svg
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          viewBox="0 0 360 200"
        >
          <rect
            fill="#fbf7ee"
            height="176"
            rx="12"
            stroke="rgba(17,17,17,0.18)"
            width="320"
            x="20"
            y="12"
          />
          <rect
            fill="none"
            height="156"
            rx="6"
            stroke="rgba(17,17,17,0.1)"
            width="300"
            x="30"
            y="22"
          />
          <text
            fill="rgba(17,17,17,0.5)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="4"
            textAnchor="middle"
            x="180"
            y="58"
          >
            CERTIFICATE OF COMPLETION
          </text>
          <text
            fill="#111111"
            fontFamily="'Caveat', 'Dancing Script', cursive"
            fontSize="34"
            fontWeight="700"
            textAnchor="middle"
            x="180"
            y="110"
          >
            Ada Lovelace
          </text>
          <line
            stroke="rgba(17,17,17,0.35)"
            strokeLinecap="round"
            strokeWidth="1"
            x1="100"
            x2="260"
            y1="124"
            y2="124"
          />
          <circle
            cx="180"
            cy="156"
            fill="none"
            r="18"
            stroke="rgba(17,17,17,0.35)"
            strokeWidth="1.4"
          />
          <circle
            cx="180"
            cy="156"
            fill="none"
            r="10"
            stroke="rgba(17,17,17,0.4)"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text
            fill="rgba(17,17,17,0.6)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="7"
            fontWeight="700"
            letterSpacing="2"
            textAnchor="middle"
            x="180"
            y="159"
          >
            SEAL
          </text>
        </svg>
      );
    case "receipt":
      return (
        <svg
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          viewBox="0 0 360 200"
        >
          <path
            d="M105 10 H255 V168 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 l-7.5 6 l-7.5 -6 Z"
            fill="#fbf7ee"
            stroke="rgba(17,17,17,0.18)"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
          <text
            fill="rgba(17,17,17,0.55)"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="8"
            fontWeight="700"
            letterSpacing="2"
            textAnchor="middle"
            x="180"
            y="30"
          >
            MOTION CO. · INVOICE
          </text>
          <line
            stroke="rgba(17,17,17,0.18)"
            strokeDasharray="2 2"
            x1="115"
            x2="245"
            y1="42"
            y2="42"
          />
          {[58, 72, 86, 100].map((y) => (
            <g key={y}>
              <rect
                fill="rgba(17,17,17,0.12)"
                height="3"
                rx="1.5"
                width="70"
                x="120"
                y={y}
              />
              <rect
                fill="rgba(17,17,17,0.2)"
                height="3"
                rx="1.5"
                width="30"
                x="210"
                y={y}
              />
            </g>
          ))}
          <line
            stroke="rgba(17,17,17,0.3)"
            x1="120"
            x2="240"
            y1="118"
            y2="118"
          />
          <text
            fill="#111111"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="10"
            fontWeight="700"
            x="120"
            y="134"
          >
            Total
          </text>
          <text
            fill="#111111"
            fontFamily="'Cabinet Grotesk', 'Outfit', sans-serif"
            fontSize="10"
            fontWeight="700"
            textAnchor="end"
            x="240"
            y="134"
          >
            $ 1,280
          </text>
          <path
            d="M122 154 C 134 142 146 148 156 152 C 168 158 180 148 192 150 C 206 152 222 146 238 150"
            fill="none"
            stroke="#111111"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      );
    case "monogram":
      return (
        <svg
          preserveAspectRatio="xMidYMid meet"
          role="presentation"
          viewBox="0 0 360 200"
        >
          <circle
            cx="180"
            cy="100"
            fill="none"
            r="76"
            stroke="rgba(17,17,17,0.18)"
            strokeWidth="1.5"
          />
          <circle
            cx="180"
            cy="100"
            fill="none"
            r="60"
            stroke="rgba(17,17,17,0.1)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            fill="#111111"
            fontFamily="'Iowan Old Style', 'Georgia', serif"
            fontSize="72"
            fontStyle="italic"
            fontWeight="500"
            textAnchor="middle"
            x="168"
            y="120"
          >
            N
          </text>
          <text
            fill="rgba(17,17,17,0.55)"
            fontFamily="'Iowan Old Style', 'Georgia', serif"
            fontSize="52"
            fontStyle="italic"
            fontWeight="500"
            textAnchor="middle"
            x="198"
            y="120"
          >
            E
          </text>
        </svg>
      );
    default:
      return null;
  }
}
