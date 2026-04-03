import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CallRecord, Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";
import { formatTimestamp } from "../utils/time";

interface ChatsScreenProps {
  ownPrincipal: Principal;
  onOpenConversation: (principal: Principal, profile: Profile) => void;
}

interface ConversationPreview {
  principal: Principal;
  profile: Profile | null;
  lastActivity: bigint;
}

export function ChatsScreen({
  ownPrincipal,
  onOpenConversation,
}: ChatsScreenProps) {
  const { actor, isFetching } = useActor();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPrincipal, setNewChatPrincipal] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const [loadingNewChat, setLoadingNewChat] = useState(false);

  const { data: callHistory, isLoading: callsLoading } = useQuery<CallRecord[]>(
    {
      queryKey: ["callHistory"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getCallHistory();
      },
      enabled: !!actor && !isFetching,
      refetchInterval: 5000,
    },
  );

  // Build known principals from call history
  useEffect(() => {
    if (!actor || !callHistory) return;

    const ownStr = ownPrincipal.toString();
    const seen = new Map<
      string,
      { principal: Principal; lastActivity: bigint }
    >();

    for (const call of callHistory) {
      const otherPrincipal =
        call.caller.toString() === ownStr ? call.callee : call.caller;
      const key = otherPrincipal.toString();
      const existing = seen.get(key);
      if (!existing || call.timestamp > existing.lastActivity) {
        seen.set(key, {
          principal: otherPrincipal,
          lastActivity: call.timestamp,
        });
      }
    }

    const entries = Array.from(seen.values());
    Promise.all(
      entries.map(async ({ principal, lastActivity }) => {
        const profile = await actor.getUserProfile(principal).catch(() => null);
        return { principal, profile, lastActivity };
      }),
    ).then((convos) => {
      convos.sort((a, b) => (b.lastActivity > a.lastActivity ? 1 : -1));
      setConversations(convos);
    });
  }, [actor, callHistory, ownPrincipal]);

  const handleOpenNewChat = async () => {
    if (!actor || !newChatPrincipal.trim()) return;
    setNewChatError("");
    setLoadingNewChat(true);
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const parsed = Principal.fromText(newChatPrincipal.trim());
      const profile = await actor.getUserProfile(parsed);
      if (!profile) {
        setNewChatError("User not found on ChatWave");
        setLoadingNewChat(false);
        return;
      }
      setShowNewChat(false);
      setNewChatPrincipal("");
      onOpenConversation(parsed, profile);
    } catch {
      setNewChatError("Invalid Principal ID");
    } finally {
      setLoadingNewChat(false);
    }
  };

  const isLoading = callsLoading && conversations.length === 0;

  return (
    <div className="flex flex-col h-full" data-ocid="chats.page">
      {/* Header */}
      <div
        className="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          background: "rgba(13,17,23,0.92)",
          borderBottom: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <h1 className="text-xl font-bold gradient-text">Chats</h1>
        <button
          type="button"
          onClick={() => setShowNewChat(true)}
          data-ocid="chats.open_modal_button"
          className="liquid-btn w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            boxShadow: "0 0 14px rgba(124,58,237,0.5)",
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2" style={{ background: "rgba(13,17,23,0.92)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            placeholder="Search chats..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/30 border-0 outline-none focus:ring-1 transition-all"
            style={{
              background: "var(--chat-surface)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 1.5px rgba(124,58,237,0.5), 0 0 12px rgba(124,58,237,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            data-ocid="chats.search_input"
          />
        </div>
      </div>

      {/* Recent contacts strip */}
      <div className="px-4 pt-3 pb-1" style={{ background: "var(--chat-bg)" }}>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {/* New chat circle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="liquid-btn w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                boxShadow: "0 0 12px rgba(124,58,237,0.4)",
              }}
            >
              <Plus className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-white/40">New</span>
          </motion.div>

          {/* Conversation avatars */}
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-2 w-8" />
                </div>
              ))
            : conversations.slice(0, 8).map(({ principal, profile }, idx) => (
                <motion.div
                  key={principal.toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx + 1) * 0.06, duration: 0.3 }}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      profile && onOpenConversation(principal, profile)
                    }
                    className="avatar-gradient-ring hover:scale-105 active:scale-95 transition-transform"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--chat-surface)]">
                      <AvatarWithFallback profile={profile} size="md" />
                    </div>
                  </button>
                  <span className="text-[10px] text-white/50 max-w-[48px] truncate text-center">
                    {profile?.displayName?.split(" ")[0] || "User"}
                  </span>
                </motion.div>
              ))}
        </div>
      </div>

      {/* Section label */}
      {conversations.length > 0 && (
        <div className="px-4 py-1">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-wider">
            Recent
          </p>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-px" data-ocid="chats.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-48 gap-4 relative overflow-hidden"
            data-ocid="chats.empty_state"
          >
            {/* Animated blob background */}
            <div
              className="absolute blob-morph opacity-10 w-32 h-32"
              style={{
                background:
                  "linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)",
              }}
            />
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 float-animation"
              style={{ background: "var(--chat-surface)" }}
            >
              <MessageSquare className="w-7 h-7 text-white/30" />
            </div>
            <div className="text-center relative z-10">
              <p className="text-white/60 font-medium">No conversations yet</p>
              <p className="text-white/30 text-sm mt-1">
                Start chatting by tapping the + button
              </p>
            </div>
          </div>
        ) : (
          <div data-ocid="chats.list">
            {conversations.map(({ principal, profile, lastActivity }, idx) => (
              <motion.button
                type="button"
                key={principal.toString()}
                onClick={() =>
                  profile && onOpenConversation(principal, profile)
                }
                data-ocid={`chats.item.${idx + 1}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
              >
                {/* Avatar with gradient ring */}
                <div className="avatar-gradient-ring flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden">
                    <AvatarWithFallback profile={profile} size="lg" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white truncate">
                      {profile?.displayName || "Unknown"}
                    </span>
                    <span className="text-white/30 text-xs ml-2 flex-shrink-0">
                      {lastActivity > BigInt(0)
                        ? formatTimestamp(lastActivity)
                        : ""}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm truncate mt-0.5">
                    {profile?.bio || "Tap to chat"}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent
          className="w-[90vw] max-w-sm rounded-xl border-white/10"
          style={{ background: "var(--chat-surface)" }}
          data-ocid="chats.dialog"
        >
          <DialogHeader>
            <DialogTitle className="gradient-text">
              New Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-white/50 text-sm">
              Enter the Principal ID of the person you want to chat with.
            </p>
            <Input
              value={newChatPrincipal}
              onChange={(e) => {
                setNewChatPrincipal(e.target.value);
                setNewChatError("");
              }}
              placeholder="e.g. aaaaa-aa"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              data-ocid="chats.input"
            />
            {newChatError && (
              <p className="text-red-400 text-xs" data-ocid="chats.error_state">
                {newChatError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewChat(false)}
                className="flex-1 border-white/10 text-white/70 hover:bg-white/5"
                data-ocid="chats.cancel_button"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleOpenNewChat}
                disabled={!newChatPrincipal.trim() || loadingNewChat}
                className="liquid-btn flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 animated-gradient-bg transition-opacity"
                data-ocid="chats.confirm_button"
              >
                {loadingNewChat ? "Loading..." : "Start Chat"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
