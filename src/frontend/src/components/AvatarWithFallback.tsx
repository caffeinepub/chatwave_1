import type { Profile } from "../backend";

interface AvatarWithFallbackProps {
  profile: Profile | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function nameToColor(name: string): string {
  const colors = [
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-rose-600",
    "bg-orange-600",
    "bg-amber-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

export function AvatarWithFallback({
  profile,
  size = "md",
  className = "",
}: AvatarWithFallbackProps) {
  const sizeClass = sizeClasses[size];
  const name = profile?.displayName || "?";
  const initial = name.charAt(0).toUpperCase();
  const colorClass = nameToColor(name);
  const avatarUrl = profile?.avatarUrl?.getDirectURL();
  const hasAvatar = avatarUrl && avatarUrl !== "";

  if (hasAvatar) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white ${className}`}
    >
      {initial}
    </div>
  );
}
