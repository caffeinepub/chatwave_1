import { Toaster } from "@/components/ui/sonner";
import type { Principal } from "@icp-sdk/core/principal";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "./backend";
import { BottomNav } from "./components/BottomNav";
import type { Tab } from "./components/BottomNav";
import { LoadingScreen } from "./components/LoadingScreen";
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

const LOAD_TIMEOUT_MS = 15000;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [screen, setScreen] = useState<Screen>({ name: "auth" });
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    const theme = localStorage.getItem("chatwave-theme") || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    // Only run when we have both identity and a ready actor
    if (!identity || !actor || actorFetching) return;
    // Don't fetch again if already fetched
    if (profileFetchedRef.current) return;
    profileFetchedRef.current = true;

    let cancelled = false;

    // Hard timeout: if backend hangs, still let the user in
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setProfileLoaded(true);
        setScreen({ name: "onboarding" });
      }
    }, LOAD_TIMEOUT_MS);

    const loadProfile = async () => {
      // Step 1: Register the user (idempotent - safe to call every time)
      // This ensures they have a #user role before any query
      try {
        await actor.selfRegisterAsUser();
      } catch {
        // If this fails (e.g. already registered), that's fine
      }

      if (cancelled) return;

      // Step 2: Fetch profile (safe now -- user has a role)
      const p = await actor.getCallerUserProfile();

      if (cancelled) return;
      clearTimeout(timeoutId);
      setProfileLoaded(true);
      if (p?.displayName) {
        setScreen({ name: "chats" });
      } else {
        setScreen({ name: "onboarding" });
      }
    };

    loadProfile().catch(() => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      setProfileLoaded(true);
      setScreen({ name: "onboarding" });
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [identity, actor, actorFetching]);

  // If identity is lost (logout), reset state
  useEffect(() => {
    if (!identity) {
      profileFetchedRef.current = false;
      setProfileLoaded(false);
      setScreen({ name: "auth" });
    }
  }, [identity]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setScreen({ name: tab } as Screen);
  };

  const mainTabs: Tab[] = ["chats", "calls", "contacts", "profile"];
  const isMainScreen = mainTabs.includes(screen.name as Tab);

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
    return <LoadingScreen />;
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

        {isMainScreen && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
      <Toaster />
    </div>
  );
}
