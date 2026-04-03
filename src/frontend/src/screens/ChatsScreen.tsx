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
import { Copy, MessageSquare, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CallRecord, Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";
import { formatTimestamp } from "../utils/time";

const SAVED_CHATS_KEY = "chatwave-manual-chats";

function loadSavedChats(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_CHATS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveChat(principalStr: string) {
  try {
    const existing = loadSavedChats();
    if (!existing.includes(principalStr)) {
      const updated = [...existing, principalStr];
      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore storage errors
  }
}

interface ChatsScreenProps {
  ownPrincipal: Principal;
  onOpenConversation: (principal: Principal, profile: Profile) => void;
}

interface ConversationPreview {
  principal: Principal;
  profile: Profile | null;
  lastActivity: bigint;
  source: "call" | "manual";
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
  const [searchQuery, setSearchQuery] = useState("");
  const builtConversationsRef = useRef(false);

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

  // Build conversations from call history + localStorage saved chats
  useEffect(() => {
    if (!actor || !callHistory) return;

    const ownStr = ownPrincipal.toString();
    const seen = new Map<
      string,
      { principal: Principal; lastActivity: bigint; source: "call" | "manual" }
    >();

    // From call history
    for (const call of callHistory) {
      const otherPrincipal =
        call.caller.toString() === ownStr ? call.callee : call.caller;
      const key = otherPrincipal.toString();
      const existing = seen.get(key);
      if (!existing || call.timestamp > existing.lastActivity) {
        seen.set(key, {
          principal: otherPrincipal,
          lastActivity: call.timestamp,
          source: "call",
        });
      }
    }

    // From localStorage saved chats
    const savedPrincipals = loadSavedChats();
    for (const pStr of savedPrincipals) {
      if (pStr === ownStr || seen.has(pStr)) continue;
      try {
        // We'll import Principal lazily -- use a placeholder for now
        // We'll handle this in the async section below
        seen.set(pStr, {
          principal: null as unknown as Principal,
          lastActivity: BigInt(0),
          source: "manual",
        });
      } catch {
        // ignore invalid principals
      }
    }

    // Resolve principals from strings for manual ones, then fetch profiles
    const resolveAndFetch = async () => {
      const { Principal } = await import("@icp-sdk/core/principal");

      // Resolve manual chat principals
      for (const pStr of savedPrincipals) {
        if (pStr === ownStr || !seen.has(pStr)) continue;
        const entry = seen.get(pStr);
        if (entry && !entry.principal) {
          try {
            entry.principal = Principal.fromText(pStr);
          } catch {
            seen.delete(pStr);
          }
        }
      }

      const entries = Array.from(seen.values()).filter((e) => !!e.principal);
      const convos = await Promise.all(
        entries.map(async ({ principal, lastActivity, source }) => {
          const profile = await actor
            .getUserProfile(principal)
            .catch(() => null);
          return { principal, profile, lastActivity, source };
        }),
      );

      convos.sort((a, b) => (b.lastActivity > a.lastActivity ? 1 : -1));
      setConversations(convos);
      builtConversationsRef.current = true;
    };

    resolveAndFetch();
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
        setNewChatError(
          "User not found on ChatWave. Check the Principal ID and try again.",
        );
        setLoadingNewChat(false);
        return;
      }
      // Save to localStorage so this chat persists
      saveChat(parsed.toString());
      setShowNewChat(false);
      setNewChatPrincipal("");
      setNewChatError("");
      onOpenConversation(parsed, profile);
    } catch {
      setNewChatError(
        "Invalid Principal ID. Make sure you copied the full ID.",
      );
    } finally {
      setLoadingNewChat(false);
    }
  };

  const handleCopyOwnId = () => {
    navigator.clipboard
      .writeText(ownPrincipal.toString())
      .then(() =>
        toast.success(
          "Your Principal ID copied! Share it so others can message you.",
        ),
      )
      .catch(() => toast.error("Failed to copy"));
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.profile?.displayName?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      {filteredConversations.length > 0 && (
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
        ) : filteredConversations.length === 0 ? (
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
                Tap + to start a new chat
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="liquid-btn px-5 py-2 rounded-full text-sm font-medium text-white relative z-10 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 0 16px rgba(124,58,237,0.4)",
              }}
              data-ocid="chats.primary_button"
            >
              Start a Chat
            </button>
          </div>
        ) : (
          <div data-ocid="chats.list">
            {filteredConversations.map(
              ({ principal, profile, lastActivity }, idx) => (
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
              ),
            )}
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChat}
        onOpenChange={(open) => {
          setShowNewChat(open);
          if (!open) {
            setNewChatPrincipal("");
            setNewChatError("");
          }
        }}
      >
        <DialogContent
          className="w-[90vw] max-w-sm rounded-xl border-white/10"
          style={{ background: "var(--chat-surface)" }}
          data-ocid="chats.dialog"
        >
          <DialogHeader>
            <DialogTitle className="gradient-text">New Chat</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {/* Help section */}
            <div
              className="rounded-lg p-3 text-xs text-white/50 leading-relaxed"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.15)",
              }}
            >
              <p className="font-semibold text-white/70 mb-1">
                How to find someone's ID
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Ask them to open the{" "}
                  <span className="text-violet-400">Profile</span> tab
                </li>
                <li>
                  They tap <span className="text-violet-400">Copy My ID</span>
                </li>
                <li>They send the ID to you</li>
                <li>Paste it below and tap Start Chat</li>
              </ol>
            </div>

            {/* My own ID to share */}
            <div
              className="rounded-lg p-3"
              style={{
                background: "rgba(6,182,212,0.06)",
                border: "1px solid rgba(6,182,212,0.15)",
              }}
            >
              <p className="text-xs text-white/40 mb-1.5">
                Your Principal ID (share this)
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 text-xs text-cyan-400 truncate font-mono"
                  style={{ fontFamily: "monospace" }}
                >
                  {ownPrincipal.toString()}
                </code>
                <button
                  type="button"
                  onClick={handleCopyOwnId}
                  className="flex-shrink-0 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  data-ocid="chats.secondary_button"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Principal input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="new-chat-principal"
                className="text-xs text-white/50 font-medium"
              >
                Their Principal ID
              </label>
              <Input
                value={newChatPrincipal}
                onChange={(e) => {
                  setNewChatPrincipal(e.target.value);
                  setNewChatError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOpenNewChat();
                }}
                id="new-chat-principal"
                placeholder="Paste their Principal ID here"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
                data-ocid="chats.input"
              />
            </div>
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
                {loadingNewChat ? "Finding..." : "Start Chat"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
