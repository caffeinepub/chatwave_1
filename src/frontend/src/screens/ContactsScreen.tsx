import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { Search, Share2, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";

interface ContactsScreenProps {
  ownPrincipal: Principal;
  onOpenConversation: (principal: Principal, profile: Profile) => void;
}

export function ContactsScreen({
  onOpenConversation: _onOpenConversation,
}: ContactsScreenProps) {
  const { actor, isFetching } = useActor();
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProfiles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });

  const filtered = (profiles || []).filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleInvite = () => {
    navigator.clipboard
      .writeText("Join ChatWave: https://chatwave.app")
      .then(() => toast.success("Invite link copied!"))
      .catch(() => toast.error("Failed to copy"));
  };

  return (
    <div className="flex flex-col h-full" data-ocid="contacts.page">
      {/* Header */}
      <div
        className="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          background: "rgba(13,17,23,0.92)",
          borderBottom: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <h1 className="text-xl font-bold gradient-text">Contacts</h1>
        <button
          type="button"
          onClick={handleInvite}
          data-ocid="contacts.secondary_button"
          className="liquid-btn flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-medium transition-all hover:scale-105 animated-gradient-bg"
        >
          <Share2 className="w-3.5 h-3.5" />
          Invite
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2" style={{ background: "rgba(13,17,23,0.92)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/30 border-0 outline-none"
            style={{ background: "var(--chat-surface)" }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 1.5px rgba(124,58,237,0.5), 0 0 12px rgba(124,58,237,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            data-ocid="contacts.search_input"
          />
        </div>
      </div>

      {/* Count */}
      {!isLoading && profiles && (
        <p className="px-4 py-2 text-xs text-white/25">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} on ChatWave
        </p>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div data-ocid="contacts.loading_state">
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
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-48 gap-3"
            data-ocid="contacts.empty_state"
          >
            <div className="float-animation">
              <UserPlus className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">
              {search ? "No contacts found" : "No users registered yet"}
            </p>
          </div>
        ) : (
          <div data-ocid="contacts.list">
            {filtered.map((profile, idx) => (
              <motion.div
                key={`${profile.displayName}-${idx}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.055,
                  duration: 0.28,
                  ease: "easeOut",
                }}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
                data-ocid={`contacts.item.${idx + 1}`}
              >
                {/* Avatar with pulse ring */}
                <div
                  className="pulse-ring rounded-full flex-shrink-0"
                  style={{
                    padding: "2px",
                    background:
                      "linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)",
                    animationDelay: `${idx * 0.3}s`,
                  }}
                >
                  <div className="rounded-full overflow-hidden">
                    <AvatarWithFallback profile={profile} size="lg" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {profile.displayName}
                  </p>
                  {profile.bio && (
                    <p className="text-white/40 text-sm truncate mt-0.5">
                      {profile.bio}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast(
                      "To chat, enter their Principal ID in Chats > New Chat",
                    );
                  }}
                  className="liquid-btn text-xs px-3 py-1.5 rounded-full font-medium text-white animated-gradient-bg transition-all hover:scale-105 active:scale-95"
                  style={{
                    boxShadow: "0 0 10px rgba(124,58,237,0.3)",
                  }}
                  data-ocid={`contacts.secondary_button.${idx + 1}`}
                >
                  Chat
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
