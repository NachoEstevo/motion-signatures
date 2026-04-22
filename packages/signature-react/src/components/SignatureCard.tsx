import type { PropsWithChildren, ReactNode } from "react";

export type SignatureCardProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}>;

/**
 * Provides the shared premium card chrome used by the signature flows.
 *
 * @param props Copy, actions, and the content slot rendered inside the card.
 * @returns A composed card layout for capture and replay surfaces.
 *
 * @example
 * <SignatureCard title="Preview" description="Animated signature" />
 */
export function SignatureCard({
  eyebrow = "Signature animation",
  title,
  description,
  actions,
  children,
}: SignatureCardProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1.25rem",
        padding: "1.5rem",
        borderRadius: "28px",
        background: "#ffffff",
        border: "1px solid rgba(15, 23, 42, 0.1)",
        boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <span
            style={{
              fontSize: "0.78rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.35rem",
              color: "#0f172a",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: 0,
              color: "#475569",
              maxWidth: "42ch",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
