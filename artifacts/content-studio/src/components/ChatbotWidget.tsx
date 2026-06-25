import { useState, useRef, useEffect } from "react";
import { useAskChatbot } from "@workspace/api-client-react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "bot";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  { role: "bot", content: "Hi! I'm Selovox AI 👋 How can I help you create viral content today?" },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askBot = useAskChatbot();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || askBot.isPending) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    askBot.mutate(
      { data: { message: text } },
      {
        onSuccess: (data: any) => {
          setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting. Try again!" }]);
        },
      }
    );
  };

  return (
    <>
      {!isOpen && (
        <Button
          data-testid="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <div
          data-testid="chatbot-panel"
          className="fixed bottom-6 right-6 w-80 flex flex-col bg-card border shadow-2xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
          style={{ height: "420px" }}
        >
          {/* Header */}
          <div className="h-14 bg-gradient-to-r from-primary to-pink-600 text-white flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm leading-tight">Selovox AI</p>
                <p className="text-xs text-blue-200">Content Strategy Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-muted/30 space-y-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  data-testid={`chatbot-msg-${i}`}
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-card text-foreground border rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {askBot.isPending && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 border-t bg-card flex gap-2 flex-shrink-0">
            <input
              data-testid="chatbot-input"
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-sm rounded-lg border px-3 py-2 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
              disabled={!input.trim() || askBot.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
