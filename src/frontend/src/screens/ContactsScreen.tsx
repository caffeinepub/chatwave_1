import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, Copy, Info, Search, UserPlus } from "lucide-react";
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
  ownPrincipal,
  onOpenConversation: _onOpenConversation,
}: ContactsScreenProps) {
  const { actor, isFetching } = useActor();
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

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

  const handleCopyOwnId = () => {
    navigator.clipboard
      .writeText(ownPrincipal.toString())
      .then(() => {
        setIdCopied(true);
        toast.success(
          "Your ID copied! Share it so others can start a chat with you.",
        );
        setTimeout(() => setIdCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  const handleContactChat = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowSheet(true);
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
          onClick={handleCopyOwnId}
          data-ocid="contacts.secondary_button"
          className="liquid-btn flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-medium transition-all hover:scale-105 animated-gradient-bg"
        >
          {idCopied ? (
            <>
              <CheckCheck className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy My ID
            </>
          )}
        </button>
      </div>

      {/* My ID banner */}
      <div
        className="mx-4 mt-2 mb-1 rounded-lg px-3 py-2 flex items-center gap-2"
        style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <Info className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <p className="text-xs text-white/50 leading-snug flex-1">
          Share your Principal ID so others can message you. Tap{" "}
          <span className="text-violet-400 font-medium">Copy My ID</span> above.
        </p>
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
                  onClick={() => handleContactChat(profile)}
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

      {/* Contact Info Sheet */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-white/10 pb-8"
          style={{ background: "var(--chat-surface)" }}
          data-ocid="contacts.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="gradient-text">
              Chat with {selectedProfile?.displayName}
            </SheetTitle>
          </SheetHeader>

          {selectedProfile && (
            <div className="flex flex-col gap-4">
              {/* Profile preview */}
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full flex-shrink-0"
                  style={{
                    padding: "2px",
                    background:
                      "linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)",
                  }}
                >
                  <div className="rounded-full overflow-hidden">
                    <AvatarWithFallback profile={selectedProfile} size="lg" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">
                    {selectedProfile.displayName}
                  </p>
                  {selectedProfile.bio && (
                    <p className="text-white/40 text-sm truncate">
                      {selectedProfile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div
                className="rounded-lg p-3 text-sm text-white/60 leading-relaxed"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.15)",
                }}
              >
                <p className="font-semibold text-white/80 mb-2">
                  To start chatting with {selectedProfile.displayName}:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>
                    Ask{" "}
                    <span className="text-violet-400">
                      {selectedProfile.displayName}
                    </span>{" "}
                    for their{" "}
                    <strong className="text-white/70">Principal ID</strong>
                  </li>
                  <li>
                    Go to the <span className="text-violet-400">Chats</span> tab
                    and tap the <span className="text-violet-400">+</span>{" "}
                    button
                  </li>
                  <li>
                    Paste their Principal ID and tap{" "}
                    <strong className="text-white/70">Start Chat</strong>
                  </li>
                </ol>
              </div>

              {/* Share own ID */}
              <div
                className="rounded-lg p-3"
                style={{
                  background: "rgba(6,182,212,0.06)",
                  border: "1px solid rgba(6,182,212,0.15)",
                }}
              >
                <p className="text-xs text-white/40 mb-1.5">
                  Or share your ID so they can message you first
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs text-cyan-400 truncate"
                    style={{ fontFamily: "monospace" }}
                  >
                    {ownPrincipal.toString()}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyOwnId}
                    className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-medium animated-gradient-bg transition-all hover:scale-105"
                    data-ocid="contacts.secondary_button"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
