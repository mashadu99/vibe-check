"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Message, sendMessage, resizeImage } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import QuickActions from "./QuickActions";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "היי! אני ויב-צ'ק, החברה הווירטואלית שלך 💜\n\nאני כאן לעזור לך עם כל סיטואציה — מה לכתוב, האם לענות, מי מייבש אותך ומי באמת מתעניין.\n\nספר/י לי מה קורה. אפשר להדביק שיחה שלמה, לתאר מצב, לשלוח סקרינשוט של השיחה, או לשאול ישירות!",
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setImage(resized);
    e.target.value = "";
  };

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim();
      if (!text && !image) return;
      if (isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text || (image ? "נתחי את התמונה הזו" : ""),
        image: image || undefined,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setImage(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        await sendMessage(
          updatedMessages,
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
              )
            );
          },
          image || undefined
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "אופס, משהו השתבש. נסה/י שוב 😅" }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, image, isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (!!input.trim() || !!image) && !isLoading;

  return (
    <div className="flex flex-col h-screen bg-brand-dark">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-card">
        <div className="relative">
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-lg">
            💜
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-card" />
        </div>
        <div>
          <h1 className="font-bold text-white leading-tight">ויב-צ'ק</h1>
          <p className="text-xs text-gray-400">היועצת הרומנטית שלך • Gen Z approved</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={msg.id} className="message-enter">
            <MessageBubble
              message={msg}
              isTyping={
                isLoading &&
                i === messages.length - 1 &&
                msg.role === "assistant" &&
                msg.content === ""
              }
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 pb-2">
          <QuickActions onSelect={(text) => handleSend(text)} />
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-brand-border bg-brand-card">
        {/* Image preview */}
        {image && (
          <div className="relative inline-block mb-2">
            <Image
              src={image}
              alt="תצוגה מקדימה"
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-xl border border-brand-border"
              unoptimized
            />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-gray-400 hover:text-brand-pink hover:border-brand-pink transition-colors disabled:opacity-40 flex-shrink-0"
            title="שלח תמונה / סקרינשוט"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder={image ? "הוסף/י הסבר לתמונה (אופציונלי)..." : "תאר/י את הסיטואציה, הדבק/י שיחה..."}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-brand-dark border border-brand-border rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple transition-colors disabled:opacity-50"
            style={{ maxHeight: "160px" }}
          />

          <button
            onClick={() => handleSend()}
            disabled={!canSend}
            className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          Enter לשליחה • Shift+Enter לשורה חדשה
        </p>
      </div>
    </div>
  );
}
