"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const SEEN_KEY = "tb-intro-seen";
const slideEase: [number, number, number, number] = [0.7, 0, 0.2, 1];
const useIsoEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function IntroOverlay() {
  const prefersReduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const finished = useRef(false);
  const [inDom, setInDom] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useIsoEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) {
      setSkipped(true);
      setInDom(false);
      return;
    }
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    rootRef.current?.classList.add("tb-intro--js");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (skipped) return;
    const hold = prefersReduced ? 1300 : 2500;
    const timer = window.setTimeout(() => setLeaving(true), hold);
    return () => window.clearTimeout(timer);
  }, [skipped, prefersReduced]);

  useEffect(() => {
    if (skipped) return;
    const dismiss = () => setLeaving(true);
    const opts = { passive: true } as const;
    window.addEventListener("keydown", dismiss, opts);
    window.addEventListener("wheel", dismiss, opts);
    window.addEventListener("touchmove", dismiss, opts);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchmove", dismiss);
    };
  }, [skipped]);

  if (skipped || !inDom) return null;

  const settle = () => {
    if (!leaving || finished.current) return;
    finished.current = true;
    setInDom(false);
  };

  return (
    <motion.div
      ref={rootRef}
      className="tb-intro"
      role="presentation"
      aria-hidden="true"
      onClick={() => setLeaving(true)}
      initial={false}
      animate={
        prefersReduced
          ? { opacity: leaving ? 0 : 1 }
          : { y: leaving ? "-100%" : "0%" }
      }
      transition={
        prefersReduced
          ? { duration: 0.3, ease: "linear" }
          : { duration: 0.7, ease: slideEase }
      }
      onAnimationComplete={settle}
    >
      <div className="tb-intro__glows" aria-hidden="true">
        <span className="tb-intro__glow tb-intro__glow--a" />
        <span className="tb-intro__glow tb-intro__glow--b" />
        <span className="tb-intro__glow tb-intro__glow--c" />
      </div>

      <div className="tb-intro__stack">
        <Image
          src="/Logo-new.png"
          alt="TraceBuild"
          width={533}
          height={400}
          priority
          className="tb-intro__logo"
        />
        <p className="tb-intro__word">
          Trace<b>Build</b>
        </p>
      </div>
    </motion.div>
  );
}
