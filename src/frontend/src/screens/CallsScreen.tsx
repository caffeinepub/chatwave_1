import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Variant_video_voice } from "../backend";
import type { CallRecord, Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { IncomingCallModal } from "../components/IncomingCallModal";
import { useActor } from "../hooks/useActor";
import { formatDuration, formatTimestamp } from "../utils/time";

interface CallsScreenProps {
  ownPrincipal: Principal;
}

interface EnrichedCall {
  record: CallRecord;
  otherPrincipal: Principal;
  profile: Profile | null;
}

export function CallsScreen({ ownPrincipal }: CallsScreenProps) {
  const { actor, isFetching } = useActor();
  const [callModalData, setCallModalData] = useState<{
    caller: Profile;
    callerPrincipal: Principal;
    callType: "voice" | "video";
  } | null>(null);

  const { data: enrichedCalls, isLoading } = useQuery<EnrichedCall[]>({
    queryKey: ["callHistory", "enriched"],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getCallHistory();
      const ownStr = ownPrincipal.toString();
      const results = await Promise.all(
        history.map(async (record) => {
          const otherPrincipal =
            record.caller.toString() === ownStr ? record.callee : record.caller;
          const profile = await actor
            .getUserProfile(otherPrincipal)
            .catch(() => null);
          return { record, otherPrincipal, profile };
        }),
      );
      return results.sort((a, b) =>
        b.record.timestamp > a.record.timestamp ? 1 : -1,
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });

  const handleCallButton = (enriched: EnrichedCall) => {
    if (!enriched.profile || !actor) return;
    setCallModalData({
      caller: enriched.profile,
      callerPrincipal: enriched.otherPrincipal,
      callType:
        enriched.record.callType === Variant_video_voice.video
          ? "video"
          : "voice",
    });
  };

  return (
    <div className="flex flex-col h-full" data-ocid="calls.page">
      {/* Header */}
      <div
        className="px-4 py-3 sticky top-0 z-10"
        style={{ background: "var(--chat-nav)" }}
      >
        <h1 className="text-xl font-bold text-white">Calls</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div data-ocid="calls.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !enrichedCalls || enrichedCalls.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 gap-4"
            data-ocid="calls.empty_state"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--chat-surface)" }}
            >
              <Phone className="w-7 h-7 text-white/30" />
            </div>
            <p className="text-white/50">No calls yet</p>
          </div>
        ) : (
          <div data-ocid="calls.list">
            {enrichedCalls.map(({ record, otherPrincipal, profile }, idx) => {
              const isVideo = record.callType === Variant_video_voice.video;
              const ownStr = ownPrincipal.toString();
              const isOutgoing = record.caller.toString() === ownStr;

              return (
                <div
                  key={`${record.timestamp.toString()}-${idx}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
                  data-ocid={`calls.item.${idx + 1}`}
                >
                  <AvatarWithFallback profile={profile} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {profile?.displayName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {record.missed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-400" />
                      ) : isOutgoing ? (
                        <PhoneCall
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--chat-accent)" }}
                        />
                      ) : (
                        <PhoneIncoming
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--chat-accent)" }}
                        />
                      )}
                      <span
                        className={`text-xs ${
                          record.missed ? "text-red-400" : "text-white/40"
                        }`}
                      >
                        {record.missed
                          ? "Missed"
                          : `${isOutgoing ? "Outgoing" : "Incoming"} • ${formatDuration(record.duration / BigInt(1_000_000_000))}`}
                      </span>
                      <span className="text-white/20 text-xs">•</span>
                      <span className="text-white/30 text-xs">
                        {formatTimestamp(record.timestamp)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCallButton({ record, otherPrincipal, profile })
                    }
                    data-ocid={`calls.secondary_button.${idx + 1}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ background: "var(--chat-surface)" }}
                  >
                    {isVideo ? (
                      <Video
                        className="w-4 h-4"
                        style={{ color: "var(--chat-accent)" }}
                      />
                    ) : (
                      <Phone
                        className="w-4 h-4"
                        style={{ color: "var(--chat-accent)" }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Call modal */}
      {callModalData && actor && (
        <IncomingCallModal
          caller={callModalData.caller}
          callerPrincipal={callModalData.callerPrincipal}
          callType={callModalData.callType}
          onClose={() => setCallModalData(null)}
          actor={actor}
        />
      )}
    </div>
  );
}
