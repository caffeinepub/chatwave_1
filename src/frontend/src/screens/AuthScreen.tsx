import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--chat-bg)" }}
      data-ocid="auth.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 w-full max-w-xs"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{
              background: "var(--chat-accent)",
              transform: "scale(1.3)",
            }}
          />
          <img
            src="/assets/generated/chatwave-logo-transparent.dim_120x120.png"
            alt="ChatWave"
            className="w-24 h-24 relative"
          />
        </motion.div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">
            ChatWave
          </h1>
          <p className="text-white/50 mt-2 text-base">Connect. Chat. Call.</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col gap-2 w-full mt-2"
        >
          {[
            "End-to-end encrypted messages",
            "Voice & video calls",
            "Share photos & media",
          ].map((feat) => (
            <div
              key={feat}
              className="flex items-center gap-3 text-white/40 text-sm"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "var(--chat-accent)" }}
              />
              {feat}
            </div>
          ))}
        </motion.div>

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full mt-4"
        >
          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="auth.primary_button"
            className="w-full h-12 text-base font-semibold rounded-full text-black"
            style={{ background: "var(--chat-accent)" }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              "Get Started"
            )}
          </Button>
          <p className="text-center text-white/30 text-xs mt-3">
            Powered by Internet Identity
          </p>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 text-white/20 text-xs">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/40"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
