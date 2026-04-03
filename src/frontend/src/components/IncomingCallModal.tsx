import type { Principal } from "@icp-sdk/core/principal";
import { Phone, PhoneOff, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Profile, backendInterface } from "../backend";
import { Variant_video_voice } from "../backend";
import { AvatarWithFallback } from "./AvatarWithFallback";

interface IncomingCallModalProps {
  caller: Profile;
  callerPrincipal: Principal;
  callType: "voice" | "video";
  onClose: () => void;
  actor: backendInterface;
}

export function IncomingCallModal({
  caller,
  callerPrincipal,
  callType,
  onClose,
  actor,
}: IncomingCallModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!accepted) return;
    if (countdown <= 0) {
      actor
        .logCall(
          callerPrincipal,
          callType === "video"
            ? Variant_video_voice.video
            : Variant_video_voice.voice,
          BigInt(10),
          false,
        )
        .catch(() => {});
      onClose();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [accepted, countdown, actor, callerPrincipal, callType, onClose]);

  const handleDecline = () => {
    actor
      .logCall(
        callerPrincipal,
        callType === "video"
          ? Variant_video_voice.video
          : Variant_video_voice.voice,
        BigInt(0),
        true,
      )
      .catch(() => {});
    onClose();
  };

  const handleAccept = () => {
    setAccepted(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        data-ocid="call.modal"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden"
          style={{ background: "var(--chat-surface)" }}
        >
          {/* Top gradient */}
          <div
            className="h-1 w-full"
            style={{ background: "var(--chat-accent)" }}
          />

          <div className="p-8 flex flex-col items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <AvatarWithFallback profile={caller} size="xl" />
              {!accepted && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "2px solid var(--chat-accent)",
                    opacity: 0.5,
                  }}
                />
              )}
            </div>

            {/* Name & call type */}
            <div className="text-center">
              <p className="text-white text-xl font-semibold">
                {caller.displayName}
              </p>
              <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
                {callType === "video" ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                {accepted
                  ? `${callType === "video" ? "Video" : "Voice"} Call • ${countdown}s`
                  : `Incoming ${callType === "video" ? "Video" : "Voice"} Call`}
              </p>
            </div>

            {accepted ? (
              <div className="text-center">
                <p className="text-white/70 text-sm">Call in progress...</p>
                <p className="text-white/50 text-xs mt-1">
                  Ends automatically in {countdown}s
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  data-ocid="call.close_button"
                  className="mt-4 px-6 py-2 rounded-full bg-destructive text-white text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </button>
              </div>
            ) : (
              <div className="flex gap-8 mt-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  data-ocid="call.cancel_button"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                    <PhoneOff className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white/60 text-xs">Decline</span>
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  data-ocid="call.confirm_button"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center group-hover:opacity-90 transition-opacity"
                    style={{ background: "var(--chat-accent)" }}
                  >
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white/60 text-xs">Accept</span>
                </button>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            data-ocid="call.close_button"
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
