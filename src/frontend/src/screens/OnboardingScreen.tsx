import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Profile } from "../backend";
import { useActor } from "../hooks/useActor";

interface OnboardingScreenProps {
  onComplete: (profile: Profile) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { actor } = useActor();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    setLoading(true);
    try {
      let avatarBlob: ExternalBlob;
      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
      } else {
        avatarBlob = ExternalBlob.fromURL("");
      }
      const profile = await actor.registerOrUpdateProfile(
        displayName.trim(),
        avatarBlob,
        bio.trim(),
      );
      toast.success("Profile created!");
      onComplete(profile);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--chat-bg)" }}
      data-ocid="onboarding.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Set up your profile</h2>
          <p className="text-white/40 text-sm mt-1">
            Let others know who you are
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer relative group"
              data-ocid="onboarding.upload_button"
            >
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "var(--chat-surface)" }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white/40" />
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--chat-accent)" }}
              >
                <Camera className="w-3.5 h-3.5 text-black" />
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-white/30 text-xs">Tap to add photo</p>
          </div>

          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-white/60 text-sm">Display Name *</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              required
              data-ocid="onboarding.input"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-white/60 text-sm">Bio (optional)</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself"
              maxLength={150}
              rows={3}
              data-ocid="onboarding.textarea"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !displayName.trim()}
            data-ocid="onboarding.submit_button"
            className="w-full h-12 text-base font-semibold rounded-full text-black mt-2"
            style={{ background: "var(--chat-accent)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
