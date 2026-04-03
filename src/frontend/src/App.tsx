import { Toaster } from "@/components/ui/sonner";
import type { Principal } from "@icp-sdk/core/principal";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Profile } from "./backend";
import { BottomNav } from "./components/BottomNav";
import type { Tab } from "./components/BottomNav";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AuthScreen } from "./screens/AuthScreen";
import { CallsScreen } from "./screens/CallsScreen";
import { ChatsScreen } from "./screens/ChatsScreen";
import { ContactsScreen } from "./screens/ContactsScreen";
import { ConversationScreen } from "./screens/ConversationScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type Screen =
  | { name: "auth" }
  | { name: "onboarding" }
  | { name: "chats" }
  | { name: "conversation"; otherPrincipal: Principal; otherProfile: Profile }
  | { name: "calls" }
  | { name: "contacts" }
  | { name: "profile" }
  | { name: "settings" };

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [screen, setScreen] = useState<Screen>({ name: "auth" });
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Apply dark mode on mount
  useEffect(() => {
    const theme = localStorage.getItem("chatwave-theme") || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  // Load profile after identity + actor ready
  useEffect(() => {
    if (!identity || !actor || actorFetching) return;
    actor
      .getOwnProfile()
      .then((p) => {
        setProfileLoaded(true);
        if (p.displayName) {
          setScreen({ name: "chats" });
        } else {
          setScreen({ name: "onboarding" });
        }
      })
      .catch(() => {
        setProfileLoaded(true);
        setScreen({ name: "onboarding" });
      });
  }, [identity, actor, actorFetching]);

  // Navigate when user changes tabs
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setScreen({ name: tab } as Screen);
  };

  const mainTabs: Tab[] = ["chats", "calls", "contacts", "profile"];
  const isMainScreen = mainTabs.includes(screen.name as Tab);

  // Auth state
  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--chat-bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 float-animation">
            <img
              src="/assets/generated/chatwave-logo-transparent.dim_120x120.png"
              alt="ChatWave"
              className="w-full h-full"
            />
          </div>
          <p className="gradient-text text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <AuthScreen />
        <Toaster />
      </>
    );
  }

  if (!profileLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--chat-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent"
            style={{
              borderColor: "var(--chat-accent)",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="gradient-text text-sm font-semibold">Setting up...</p>
        </div>
      </div>
    );
  }

  if (screen.name === "onboarding") {
    return (
      <>
        <OnboardingScreen
          onComplete={() => {
            setScreen({ name: "chats" });
          }}
        />
        <Toaster />
      </>
    );
  }

  const ownPrincipal = identity.getPrincipal();

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: "#04060e" }}
    >
      <div
        className="relative w-full max-w-[430px] min-h-screen flex flex-col"
        style={{ background: "var(--chat-bg)" }}
      >
        {/* Main content */}
        <main className="flex-1 pb-16 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex-1 flex flex-col h-full"
              style={{ minHeight: "calc(100vh - 4rem)" }}
            >
              {screen.name === "conversation" ? (
                <ConversationScreen
                  otherUserPrincipal={screen.otherPrincipal}
                  otherUserProfile={screen.otherProfile}
                  ownPrincipal={ownPrincipal}
                  onBack={() => {
                    setActiveTab("chats");
                    setScreen({ name: "chats" });
                  }}
                />
              ) : screen.name === "settings" ? (
                <SettingsScreen
                  ownPrincipal={ownPrincipal}
                  onBack={() => {
                    setActiveTab("profile");
                    setScreen({ name: "profile" });
                  }}
                />
              ) : screen.name === "calls" ? (
                <CallsScreen ownPrincipal={ownPrincipal} />
              ) : screen.name === "contacts" ? (
                <ContactsScreen
                  ownPrincipal={ownPrincipal}
                  onOpenConversation={(principal, profile) => {
                    setScreen({
                      name: "conversation",
                      otherPrincipal: principal,
                      otherProfile: profile,
                    });
                  }}
                />
              ) : screen.name === "profile" ? (
                <ProfileScreen
                  ownPrincipal={ownPrincipal}
                  onNavigateSettings={() => setScreen({ name: "settings" })}
                />
              ) : (
                <ChatsScreen
                  ownPrincipal={ownPrincipal}
                  onOpenConversation={(principal, profile) => {
                    setScreen({
                      name: "conversation",
                      otherPrincipal: principal,
                      otherProfile: profile,
                    });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom nav - only on main screens */}
        {isMainScreen && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
      <Toaster />
    </div>
  );
}
