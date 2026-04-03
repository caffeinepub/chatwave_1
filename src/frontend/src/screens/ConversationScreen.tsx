import type { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Image,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Message, Profile } from "../backend";
import { AvatarWithFallback } from "../components/AvatarWithFallback";
import { useActor } from "../hooks/useActor";
import { formatTimestamp } from "../utils/time";

interface ConversationScreenProps {
  otherUserPrincipal: Principal;
  otherUserProfile: Profile;
  ownPrincipal: Principal;
  onBack: () => void;
}

export function ConversationScreen({
  otherUserPrincipal,
  otherUserProfile,
  ownPrincipal,
  onBack,
}: ConversationScreenProps) {
  const { actor } = useActor();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    msgId: bigint;
    x: number;
    y: number;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const loadMessages = useCallback(async () => {
    if (!actor) return;
    try {
      const msgs = await actor.getMessagesWith(otherUserPrincipal);
      setMessages(msgs);
      // Mark unseen messages
      for (const msg of msgs) {
        if (
          !msg.seen &&
          msg.sender.toString() === otherUserPrincipal.toString()
        ) {
          actor.markMessageSeen(msg.timestamp).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, [actor, otherUserPrincipal]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally using messages.length
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!actor || (!input.trim() && !mediaFile)) return;
    setSending(true);
    try {
      let mediaBlob: ExternalBlob;
      if (mediaFile) {
        const bytes = new Uint8Array(await mediaFile.arrayBuffer());
        mediaBlob = ExternalBlob.fromBytes(bytes);
      } else {
        mediaBlob = ExternalBlob.fromURL("");
      }
      await actor.sendMessage(otherUserPrincipal, input.trim(), mediaBlob);
      setInput("");
      setMediaFile(null);
      setMediaPreview(null);
      await loadMessages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (msg.sender.toString() !== ownPrincipal.toString()) return;
    e.preventDefault();
    setContextMenu({ msgId: msg.timestamp, x: e.clientX, y: e.clientY });
  };

  const handleDelete = async (msgId: bigint) => {
    if (!actor) return;
    setContextMenu(null);
    try {
      await actor.deleteMessage(msgId);
      await loadMessages();
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const dismissContextMenu = () => {
    if (contextMenu) setContextMenu(null);
  };

  return (
    <div
      className="flex flex-col h-full dot-pattern"
      style={{ background: "var(--chat-bg)" }}
      onClick={dismissContextMenu}
      onKeyDown={dismissContextMenu}
      data-ocid="conversation.page"
    >
      {/* Header */}
      <div
        className="glass flex items-center gap-3 px-3 py-2.5 sticky top-0 z-10"
        style={{
          background: "rgba(13,17,23,0.92)",
          borderBottom: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          data-ocid="conversation.close_button"
          className="text-white/60 hover:text-white transition-colors p-1 hover:scale-110 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="avatar-gradient-ring">
          <div className="w-9 h-9 rounded-full overflow-hidden">
            <AvatarWithFallback profile={otherUserProfile} size="md" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">
            {otherUserProfile.displayName}
          </p>
          <p className="text-white/40 text-xs">tap for more info</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full gap-3 opacity-50"
              data-ocid="conversation.empty_state"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center float-animation"
                style={{ background: "var(--chat-surface)" }}
              >
                <Image className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-white/40 text-sm">No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender.toString() === ownPrincipal.toString();
              const mediaUrl = msg.mediaUrl?.getDirectURL();
              const hasMedia = mediaUrl && mediaUrl !== "";

              return (
                <motion.div
                  key={`${msg.timestamp.toString()}-${idx}`}
                  initial={{
                    opacity: 0,
                    x: isMine ? 20 : -20,
                    scale: 0.9,
                  }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                  }}
                  className={`flex flex-col max-w-[75%] ${
                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                  data-ocid={`conversation.item.${idx + 1}`}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                >
                  {msg.deleted ? (
                    <div
                      className="px-3 py-2 rounded-2xl text-sm italic"
                      style={{
                        background: "var(--chat-surface)",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      This message was deleted
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={{
                        background: isMine
                          ? "linear-gradient(135deg, var(--chat-sent-start), var(--chat-sent-end))"
                          : "var(--chat-received)",
                        color: "white",
                        boxShadow: isMine
                          ? "0 2px 12px rgba(124,58,237,0.3)"
                          : "none",
                      }}
                    >
                      {hasMedia && (
                        <img
                          src={mediaUrl}
                          alt="media"
                          className="rounded-lg mb-1 max-w-full"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                      )}
                      {msg.content && <span>{msg.content}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[10px] text-white/30">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    {isMine && !msg.deleted && (
                      <span
                        className="text-[10px]"
                        style={{
                          color: msg.seen ? "#7c3aed" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {msg.seen ? (
                          <CheckCheck className="w-3 h-3 inline" />
                        ) : (
                          <Check className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-xl shadow-xl py-1 min-w-[140px] glass"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 60),
            background: "rgba(17,24,39,0.95)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.2)",
          }}
          data-ocid="conversation.dropdown_menu"
        >
          <button
            type="button"
            onClick={() => handleDelete(contextMenu.msgId)}
            className="flex items-center gap-2 px-4 py-2.5 w-full text-sm text-red-400 hover:bg-white/5 transition-colors"
            data-ocid="conversation.delete_button"
          >
            <Trash2 className="w-4 h-4" />
            Delete for everyone
          </button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div
          className="px-4 py-2 border-t border-white/10 glass"
          style={{ background: "rgba(17,24,39,0.9)" }}
        >
          <div className="relative inline-block">
            <img
              src={mediaPreview}
              alt="preview"
              className="h-16 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setMediaFile(null);
                setMediaPreview(null);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className="glass flex items-center gap-2 px-3 py-2.5"
        style={{
          background: "rgba(13,17,23,0.95)",
          borderTop: "1px solid rgba(124,58,237,0.12)",
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="conversation.upload_button"
          className="text-white/40 hover:text-white/70 transition-colors p-1.5 hover:scale-110 active:scale-95"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          data-ocid="conversation.input"
          className="flex-1 h-10 px-4 rounded-full text-sm text-white placeholder:text-white/30 border-0 outline-none transition-all"
          style={{ background: "var(--chat-surface)" }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 0 1.5px rgba(124,58,237,0.5), 0 0 16px rgba(124,58,237,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!input.trim() && !mediaFile)}
          data-ocid="conversation.primary_button"
          className="liquid-btn w-10 h-10 rounded-full flex items-center justify-center transition-all animated-gradient-bg hover:scale-110 active:scale-95 disabled:opacity-40 disabled:scale-100"
          style={{
            boxShadow: sending ? "none" : "0 0 16px rgba(124,58,237,0.5)",
          }}
        >
          {sending ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
