import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Connecting...",
  "Loading profile...",
  "Almost ready...",
];

const TIMEOUT_MS = 8000;

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = TIMEOUT_MS;
    const targetProgress = 90;

    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setProgress(eased * targetProgress);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Show retry message after the timeout fires
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS + 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--chat-bg)" }}
    >
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blob-morph"
        style={{
          background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute w-48 h-48 rounded-full opacity-10 blob-morph"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          bottom: "20%",
          right: "10%",
          pointerEvents: "none",
          animationDelay: "3s",
        }}
      />

      <motion.div
        className="flex flex-col items-center gap-6 px-10 w-full max-w-xs relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative">
          <motion.div
            className="w-20 h-20"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <img
              src="/assets/generated/chatwave-logo-transparent.dim_120x120.png"
              alt="ChatWave"
              className="w-full h-full"
            />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "rgba(124, 58, 237, 0.2)" }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <span className="gradient-text text-2xl font-bold tracking-wide">
          ChatWave
        </span>

        <div className="w-full">
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "var(--chat-surface)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4)",
                width: `${progress}%`,
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="h-10 overflow-hidden flex flex-col items-center justify-center">
          {timedOut ? (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p
                className="text-xs text-center"
                style={{ color: "var(--chat-muted)" }}
              >
                Taking longer than expected
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-semibold gradient-text underline underline-offset-2 cursor-pointer"
              >
                Tap to retry
              </button>
            </motion.div>
          ) : (
            <motion.p
              key={statusIndex}
              className="gradient-text text-sm font-medium text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {STATUS_MESSAGES[statusIndex]}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
