import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Moon, Shield, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";

interface SettingsScreenProps {
  ownPrincipal: Principal;
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("chatwave-theme") !== "light";
  });
  const [lastSeenVisible, setLastSeenVisible] = useState(true);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["ownProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getOwnProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem("chatwave-theme", checked ? "dark" : "light");
    document.documentElement.classList.toggle("dark", checked);
  };

  const handleUnblock = async (principal: Principal) => {
    if (!actor) return;
    try {
      await actor.unblockUser(principal);
      await queryClient.invalidateQueries({ queryKey: ["ownProfile"] });
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  return (
    <div className="flex flex-col h-full" data-ocid="settings.page">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ background: "var(--chat-nav)" }}
      >
        <button
          type="button"
          onClick={onBack}
          data-ocid="settings.close_button"
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Appearance */}
        <section>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Appearance
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--chat-surface)" }}
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-white/60" />
                ) : (
                  <Sun className="w-5 h-5 text-white/60" />
                )}
                <Label className="text-white cursor-pointer">Dark Mode</Label>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
                data-ocid="settings.switch"
              />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Privacy
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--chat-surface)" }}
          >
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-white/60" />
                <div>
                  <Label className="text-white cursor-pointer">
                    Show Last Seen
                  </Label>
                  <p className="text-white/40 text-xs">
                    Others can see when you were online
                  </p>
                </div>
              </div>
              <Switch
                checked={lastSeenVisible}
                onCheckedChange={setLastSeenVisible}
                data-ocid="settings.toggle"
              />
            </div>
          </div>
        </section>

        {/* Blocked Users */}
        <section>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Blocked Users
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--chat-surface)" }}
          >
            {isLoading ? (
              <div className="p-4" data-ocid="settings.loading_state">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !profile?.blockedUsers?.length ? (
              <div
                className="px-4 py-4 text-center"
                data-ocid="settings.empty_state"
              >
                <p className="text-white/30 text-sm">No blocked users</p>
              </div>
            ) : (
              <div data-ocid="settings.list">
                {profile.blockedUsers.map((principal, idx) => (
                  <BlockedUserRow
                    key={principal.toString()}
                    principal={principal}
                    idx={idx}
                    actor={actor}
                    onUnblock={() => handleUnblock(principal)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* App info */}
        <div className="text-center py-4">
          <p className="text-white/20 text-xs">ChatWave • Version 1.0.0</p>
          <p className="text-white/20 text-xs mt-1">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/40"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function BlockedUserRow({
  principal,
  idx,
  actor,
  onUnblock,
}: {
  principal: Principal;
  idx: number;
  actor: any;
  onUnblock: () => void;
}) {
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["userProfile", principal.toString()],
    queryFn: () => actor?.getUserProfile(principal) ?? null,
    enabled: !!actor,
  });

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-t border-white/5 first:border-t-0"
      data-ocid={`settings.item.${idx + 1}`}
    >
      <AvatarWithFallback profile={profile || null} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {profile?.displayName || "Unknown User"}
        </p>
        <p className="text-white/40 text-xs font-mono truncate">
          {principal.toString().slice(0, 20)}...
        </p>
      </div>
      <button
        type="button"
        onClick={onUnblock}
        data-ocid={`settings.delete_button.${idx + 1}`}
        className="text-xs px-3 py-1 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
      >
        Unblock
      </button>
    </div>
  );
}
