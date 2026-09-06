"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Eyebrow } from "./primitives";
import { EASE_OUT, staggerParent, cardReveal, inView } from "@/lib/landing/motion";

/* ── palette-only micro-visuals ─────────────────────────────────────────── */

function SwissLine() {
  // simplified Switzerland outline (Geneva tip lower-left, Ticino spike lower-centre)
  const CH =
    "M12,54 L20,46 L16,34 L26,22 L36,15 L42,12 L54,15 L62,12 L66,8 L70,13 " +
    "L82,12 L92,18 L98,24 L106,33 L110,42 L104,48 L98,50 L92,46 L88,52 " +
    "L85,62 L82,70 L79,61 L77,53 L68,55 L60,60 L52,56 L44,61 L36,57 L26,58 L18,53 Z";
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      <path d={CH} fill="var(--tb-accent)" fillOpacity="0.05" stroke="var(--tb-accent)" strokeWidth="1" strokeOpacity="0.65" strokeLinejoin="round" />
      <circle cx="50" cy="36" r="3" fill="var(--tb-accent-cyan)">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function DocStack() {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={26 + i * 6}
          y={14 + i * 6}
          width="60"
          height="46"
          rx="3"
          fill="var(--tb-glass)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
        />
      ))}
      <line x1="44" y1="14" x2="44" y2="78" stroke="var(--tb-accent)" strokeWidth="1.5" strokeOpacity="0.7" />
    </svg>
  );
}

function Timeline() {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden>
      <line x1="60" y1="8" x2="60" y2="72" stroke="var(--tb-accent)" strokeWidth="1" strokeOpacity="0.4" />
      {[14, 30, 46].map((y) => (
        <circle key={y} cx="60" cy={y} r="2.5" fill="var(--tb-accent)" fillOpacity="0.55" />
      ))}
      <circle cx="60" cy="62" r="4" fill="var(--tb-info)">
        <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function Monogram() {
  return (
    <div
      aria-hidden
      style={{
        width: 120,
        height: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--tb-r-pill)",
          background: "var(--tb-glass)",
          border: "1px solid var(--tb-border)",
          boxShadow: "0 0 0 4px rgba(56,189,248,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 700,
            fontSize: 18,
            background: "var(--tb-accent-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          TB
        </span>
      </span>
    </div>
  );
}

const BLOCKS = [
  {
    visual: <SwissLine />,
    h: "Ihre Projektdaten verlassen die Schweiz nicht.",
    p: "Hosting in Schweizer Rechenzentren, DSG-konform, verschlüsselt im Transport und im Speicher. Kein Datenabfluss in Drittländer.",
    proof: "Datenstandort CH · ISO-27001-zertifizierte Infrastruktur",
  },
  {
    visual: <DocStack />,
    h: "TraceBuild prüft. Sie entscheiden.",
    p: "Die KI liefert eine übersichtliche Auswertung — sortiert, verortet, einfach zu interpretieren. Die Zeichnung ändern und die Freigabe erteilen bleibt bei Ihrem Team. Menschenverstand ist hier nicht ersetzbar.",
    proof: "Kein Eingriff in den Plan · Freigabe durch Ihr Team",
  },
  {
    visual: <Timeline />,
    h: "Ändert sich was, sagen wir Bescheid.",
    p: "Wir behalten Normen und Vorschriften im Blick, damit Sie es nicht müssen. Wird für Ihr Projekt etwas relevant, hören Sie von uns — bevor es zum Problem wird.",
    proof: "Wir schauen hin · Sie bekommen Bescheid",
  },
  {
    visual: <Monogram />,
    h: "Sie schreiben uns, wir helfen.",
    p: "Kein Ticket-System, keine Warteschleife. Wir kennen nicht jede Vorschrift auswendig — aber wir packen mit an, wo wir können, und melden uns schnell.",
    proof: "Fester Kontakt · Antwort < 1 Werktag",
  },
];

const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export default function TrustBlocks() {
  const reduce = useReducedMotion();
  const cardV = reduce ? fadeOnly : cardReveal;

  return (
    <section
      id="vertrauen"
      style={{ position: "relative", padding: "var(--tb-section-y) var(--tb-gutter)" }}
    >
      <div style={{ maxWidth: "var(--tb-max)", margin: "0 auto" }}>
        <Eyebrow>Qualität</Eyebrow>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          style={{ fontSize: "clamp(26px,3.4vw,44px)", margin: "18px 0 48px", maxWidth: 620 }}
        >
          Unser Anspruch an jede Prüfung.
        </motion.h2>

        <div
          className="tb-trust-rail"
          style={{
            overflowX: "auto",
            overscrollBehaviorX: "contain",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x proximity",
            scrollPaddingInline: "var(--tb-gutter)",
            marginInline: "calc(-1 * var(--tb-gutter))",
            paddingInline: "var(--tb-gutter)",
            paddingBlock: "6px 20px",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 var(--tb-gutter), #000 calc(100% - var(--tb-gutter)), transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0, #000 var(--tb-gutter), #000 calc(100% - var(--tb-gutter)), transparent 100%)",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            variants={staggerParent(0.09)}
            className="tb-trust-track"
            style={{
              display: "flex",
              gap: "clamp(16px,3vw,32px)",
              width: "max-content",
              padding: "4px",
            }}
          >
            {BLOCKS.map((b) => (
              <motion.article
                key={b.h}
                variants={cardV}
                className="tb-trust-card"
                style={{
                  flex: "0 0 clamp(280px,78vw,400px)",
                  scrollSnapAlign: "start",
                  borderRadius: "var(--tb-r-container)",
                  border: "1px solid var(--tb-border)",
                  background: "var(--tb-glass)",
                  padding: "clamp(24px,3vw,44px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  transition:
                    "border-color var(--tb-dur-base) var(--tb-ease-out), box-shadow var(--tb-dur-base) var(--tb-ease-out), background var(--tb-dur-base) var(--tb-ease-out)",
                }}
              >
                <div style={{ height: 80 }}>{b.visual}</div>
                <h3 style={{ fontSize: "clamp(19px,1.8vw,24px)", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>
                  {b.h}
                </h3>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "var(--tb-text-secondary)" }}>
                  {b.p}
                </p>
                <p style={{ margin: "auto 0 0", paddingTop: 14, borderTop: "1px solid var(--tb-hairline)", fontSize: 12, letterSpacing: "0.01em", color: "var(--tb-text-tertiary)" }}>
                  {b.proof}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .tb-trust-rail { scrollbar-width: thin; scrollbar-color: #38bdf8 rgba(255,255,255,0.05); }
        .tb-trust-rail::-webkit-scrollbar { height: 6px; }
        .tb-trust-rail::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
        .tb-trust-rail::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 999px; }
        .tb-trust-rail::-webkit-scrollbar-thumb { background: linear-gradient(90deg,#4fd1ff,#2862d7); border-radius: 999px; }
        .tb-trust-rail::-webkit-scrollbar-thumb:hover { background: linear-gradient(90deg,#4fd1ff,#38bdf8); }
        .tb-trust-card:hover {
          border-color: var(--tb-border-strong);
          background: var(--tb-glass-hover);
          box-shadow: var(--tb-lift);
        }
      `}</style>
    </section>
  );
}
