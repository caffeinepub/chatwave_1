import { MessageSquare, Phone, User, Users } from "lucide-react";
import { motion } from "motion/react";

export type Tab = "chats" | "calls" | "contacts" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: {
  id: Tab;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: "chats", label: "Chats", Icon: MessageSquare },
  { id: "calls", label: "Calls", Icon: Phone },
  { id: "contacts", label: "Contacts", Icon: Users },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-16 glass flex items-center z-40"
      style={{
        background: "rgba(13,17,23,0.88)",
        borderTop: "1px solid rgba(124,58,237,0.18)",
      }}
      data-ocid="main.tab"
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            data-ocid={`nav.${id}.tab`}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors"
            style={{
              color: active ? "transparent" : "rgba(255,255,255,0.38)",
            }}
          >
            {/* Active pill indicator */}
            {active && (
              <motion.div
                layoutId="nav-pill"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #7c3aed, #ec4899, #06b6d4)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Icon — gradient when active */}
            {active ? (
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Icon className="w-5 h-5" />
              </span>
            ) : (
              <Icon className="w-5 h-5" />
            )}

            <span
              className="text-[10px] font-medium tracking-wide"
              style={{
                background: active
                  ? "linear-gradient(135deg, #7c3aed, #ec4899, #06b6d4)"
                  : undefined,
                WebkitBackgroundClip: active ? "text" : undefined,
                WebkitTextFillColor: active ? "transparent" : undefined,
                backgroundClip: active ? "text" : undefined,
                color: active ? undefined : "rgba(255,255,255,0.38)",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
