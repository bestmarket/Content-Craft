import { useState, useEffect, useRef } from "react";
import { useListConversations, useListMessages, useSendMessage } from "@workspace/api-client-react";
import { getListConversationsQueryKey, getListMessagesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Loader2, Circle, ArrowLeft } from "lucide-react";

export default function AdminChat() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const { data: conversations, isLoading } = useListConversations({
    query: { queryKey: getListConversationsQueryKey(), refetchInterval: 10000 },
  });

  const { data: messages, isLoading: msgsLoading } = useListMessages(selectedConvId!, {
    query: {
      enabled: !!selectedConvId,
      queryKey: getListMessagesQueryKey(selectedConvId!),
      refetchInterval: 5000,
    },
  });

  const sendMsg = useSendMessage();

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConv = (id: number) => {
    setSelectedConvId(id);
    setMobileView("chat");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConvId) return;
    sendMsg.mutate(
      { id: selectedConvId, data: { content: message } },
      {
        onSuccess: () => {
          setMessage("");
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(selectedConvId) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => toast({ title: "Failed to send", variant: "destructive" }),
      }
    );
  };

  const selectedConv = conversations?.find((c: any) => c.id === selectedConvId);

  const ConversationList = () => (
    <Card className="border overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">
        Conversations ({conversations?.length ?? 0})
      </div>
      <div className="flex-1 overflow-y-auto divide-y">
        {isLoading ? (
          <div className="p-3"><Skeleton className="h-24 w-full" /></div>
        ) : !conversations?.length ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No conversations</div>
        ) : conversations.map((conv: any) => (
          <button
            key={conv.id}
            data-testid={`conv-${conv.id}`}
            onClick={() => handleSelectConv(conv.id)}
            className={`w-full text-left p-3 transition-colors ${selectedConvId === conv.id ? "bg-primary/5" : "hover:bg-muted/30"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground truncate">{conv.userName ?? `User #${conv.userId}`}</span>
              {conv.unreadCount > 0 && (
                <Badge className="ml-1 flex-shrink-0 bg-red-500 text-white text-xs px-1.5 py-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Circle className={`w-2 h-2 flex-shrink-0 ${conv.status === "open" ? "fill-green-500 text-green-500" : "fill-slate-300 text-muted-foreground/60"}`} />
              <p className="text-xs text-muted-foreground truncate">{conv.lastMessage ?? "No messages yet"}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );

  const ChatView = () => (
    <Card className="border overflow-hidden flex flex-col h-full">
      {!selectedConvId ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Select a conversation</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-12 border-b px-3 flex items-center bg-card flex-shrink-0 gap-2">
            {/* Back button — mobile only */}
            <button
              className="md:hidden text-muted-foreground hover:text-muted-foreground mr-1"
              onClick={() => setMobileView("list")}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground truncate">
              {selectedConv?.userName ?? "User"}
            </span>
            {selectedConv?.status && (
              <Circle className={`w-2 h-2 flex-shrink-0 ml-auto ${selectedConv.status === "open" ? "fill-green-500 text-green-500" : "fill-slate-300 text-muted-foreground/60"}`} />
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-muted/30 space-y-3">
            {msgsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !messages?.length ? (
              <div className="text-center text-muted-foreground text-sm py-8">No messages</div>
            ) : messages.map((msg: any) => (
              <div
                key={msg.id}
                data-testid={`msg-${msg.id}`}
                className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    msg.senderRole === "admin"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-card text-foreground border rounded-bl-md"
                  }`}
                >
                  {msg.content}
                  <p className={`text-xs mt-1 ${msg.senderRole === "admin" ? "text-blue-200" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="border-t p-3 flex gap-2 bg-card flex-shrink-0">
            <Input
              data-testid="input-admin-message"
              placeholder="Reply to user..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sendMsg.isPending || !message.trim()}>
              {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </>
      )}
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Support Chat</h1>
        <p className="text-muted-foreground text-sm">Respond to user support requests</p>
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden md:grid md:grid-cols-3 gap-4" style={{ height: "65vh" }}>
        <ConversationList />
        <div className="md:col-span-2">
          <ChatView />
        </div>
      </div>

      {/* ── Mobile: one panel at a time ── */}
      <div className="md:hidden" style={{ height: "70vh" }}>
        {mobileView === "list" ? <ConversationList /> : <ChatView />}
      </div>
    </div>
  );
}
