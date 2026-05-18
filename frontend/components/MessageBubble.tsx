import { Message } from "@/lib/api";
import Image from "next/image";

interface Props {
  message: Message;
  isTyping: boolean;
}

export default function MessageBubble({ message, isTyping }: Props) {
  const isUser = message.role === "user";

  if (isTyping) {
    return (
      <div className="flex items-end gap-2">
        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm flex-shrink-0">
          💜
        </div>
        <div className="bg-brand-card border border-brand-border rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-brand-purple rounded-full animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] gradient-bg text-white rounded-2xl rounded-br-sm overflow-hidden">
          {message.image && (
            <Image
              src={message.image}
              alt="תמונה שנשלחה"
              width={300}
              height={300}
              className="w-full object-cover max-h-60"
              unoptimized
            />
          )}
          {message.content && (
            <p className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          {!message.content && message.image && <div className="pb-1" />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm flex-shrink-0">
        💜
      </div>
      <div className="max-w-[80%] bg-brand-card border border-brand-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-gray-100 whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
