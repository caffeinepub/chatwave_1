import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Edit3, Loader2, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatTimestamp } from "../utils/time";

interface ProfileScreenProps {
  ownPrincipal: Principal;
  onNavigateSettings: () => void;
}

export function ProfileScreen({
  ownPrincipal,
  onNavigateSettings,
}: ProfileScreenProps) {
  const { actor, isFetching } = useActor();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["ownProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getOwnProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const startEdit = () => {
    if (!profile) return;
    setEditName(profile.displayName);
    setEditBio(profile.bio);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setEditing(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!actor || !profile) return;
    setSaving(true);
    try {
      let avatarBlob: ExternalBlob;
      if (editAvatarFile) {
        const bytes = new Uint8Array(await editAvatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
      } else {
        avatarBlob = profile.avatarUrl;
      }
      await actor.registerOrUpdateProfile(
        editName.trim(),
        avatarBlob,
        editBio.trim(),
      );
      await queryClient.invalidateQueries({ queryKey: ["ownProfile"] });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full" data-ocid="profile.page">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ background: "var(--chat-nav)" }}
      >
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              data-ocid="profile.edit_button"
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full"
              style={{ background: "var(--chat-surface)" }}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateSettings}
            data-ocid="profile.secondary_button"
            className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full"
            style={{ background: "var(--chat-surface)" }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            className="flex flex-col items-center gap-4 p-8"
            data-ocid="profile.loading_state"
          >
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : editing ? (
          <div className="flex flex-col gap-5 p-6">
            {/* Avatar edit */}
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="edit-avatar"
                className="cursor-pointer relative group"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  {editAvatarPreview ? (
                    <img
                      src={editAvatarPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarWithFallback profile={profile || null} size="xl" />
                  )}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "var(--chat-accent)" }}
                >
                  <Camera className="w-4 h-4 text-black" />
                </div>
              </label>
              <input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-white/60">Display Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                data-ocid="profile.input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-white/60">Bio</Label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white resize-none"
                data-ocid="profile.textarea"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="flex-1 border-white/10 text-white/70 hover:bg-white/5"
                data-ocid="profile.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 text-black font-medium"
                style={{ background: "var(--chat-accent)" }}
                data-ocid="profile.save_button"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Avatar hero */}
            <div
              className="flex flex-col items-center gap-4 py-8"
              style={{ background: "var(--chat-surface)" }}
            >
              <AvatarWithFallback profile={profile || null} size="xl" />
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">
                  {profile?.displayName}
                </h2>
                {profile?.bio && (
                  <p className="text-white/50 text-sm mt-1 max-w-[200px] text-center">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ background: "var(--chat-surface)" }}
              >
                <p className="text-white/40 text-xs mb-1">Principal ID</p>
                <p className="text-white/70 text-xs font-mono break-all">
                  {ownPrincipal.toString()}
                </p>
              </div>
              {profile && profile.lastSeen > BigInt(0) && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "var(--chat-surface)" }}
                >
                  <p className="text-white/40 text-xs mb-1">Last seen</p>
                  <p className="text-white/70 text-sm">
                    {formatTimestamp(profile.lastSeen)}
                  </p>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="p-4 mt-auto">
              <Button
                onClick={clear}
                variant="outline"
                className="w-full border-red-900/40 text-red-400 hover:bg-red-950/20"
                data-ocid="profile.delete_button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
