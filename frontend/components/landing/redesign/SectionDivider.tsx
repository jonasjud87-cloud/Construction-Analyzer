type DividerVariant = "line" | "node" | "wide" | "gap";

export default function SectionDivider({ variant = "line" }: { variant?: DividerVariant }) {
  return (
    <div className={`tb-divider tb-divider--${variant}`} aria-hidden="true" role="presentation">
      {variant === "node" ? <span className="tb-divider__node" /> : null}

      <style>{`
        .tb-divider {
          pointer-events: none;
          width: 100%;
        }
        .tb-divider--line,
        .tb-divider--node {
          position: relative;
          width: min(var(--tb-max), calc(100% - 2 * var(--tb-gutter)));
          height: 1px;
          margin: clamp(24px, 6vh, 72px) auto;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--tb-hairline) 20%,
            var(--tb-hairline) 80%,
            transparent 100%
          );
        }
        .tb-divider--node {
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--tb-hairline) 28%,
            var(--tb-hairline) 72%,
            transparent 100%
          );
        }
        .tb-divider--wide {
          width: 100%;
          height: 1px;
          margin: clamp(12px, 3vh, 34px) 0;
          background: var(--tb-hairline);
          opacity: 0.6;
        }
        .tb-divider--gap {
          height: clamp(32px, 8vh, 96px);
          margin: 0;
        }
        .tb-divider__node {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          transform: translate(-50%, -50%) rotate(45deg);
          background: var(--tb-accent);
          opacity: 0.26;
        }
        @media (prefers-reduced-motion: no-preference) {
          .tb-divider__node {
            animation: tb-divider-pulse 4.5s ease-in-out infinite;
          }
        }
        @keyframes tb-divider-pulse {
          0%, 100% { opacity: 0.16; }
          50% { opacity: 0.32; }
        }
      `}</style>
    </div>
  );
}
