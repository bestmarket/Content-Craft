import { useState, useEffect, useRef } from "react";
import { useListConversations, useCreateConversation, useListMessages, useSendMessage } from "@workspace/api-client-react";
import { getListConversationsQueryKey, getListMessagesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Loader2 } from "lucide-react";

export default function Chat() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  const { data: conversations, isLoading: convsLoading } = useListConversations({
    query: { queryKey: getListConversationsQueryKey() },
  });

  const { data: messages, isLoading: msgsLoading } = useListMessages(activeConvId!, {
    query: {
      enabled: !!activeConvId,
      queryKey: getListMessagesQueryKey(activeConvId!),
      refetchInterval: 5000,
    },
  });

  const createConv = useCreateConversation();
  const sendMsg = useSendMessage();

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartChat = () => {
    createConv.mutate(
      { data: { initialMessage: "Hello, I need help!" } },
      {
        onSuccess: (conv: any) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setActiveConvId(conv.id);
        },
      }
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeConvId) return;
    sendMsg.mutate(
      { id: activeConvId, data: { content: message } },
      {
        onSuccess: () => {
          setMessage("");
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(activeConvId) });
        },
        onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Chat</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with our support team directly</p>
      </div>

      {convsLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !conversations || conversations.length === 0 ? (
        <Card className="p-10 text-center border">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-slate-700 font-medium mb-1">No active conversations</h3>
          <p className="text-slate-400 text-sm mb-4">Start a conversation with our support team</p>
          <Button onClick={handleStartChat} disabled={createConv.isPending}>
            {createConv.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Start Support Chat
          </Button>
        </Card>
      ) : (
        <Card className="border overflow-hidden flex flex-col" style={{ height: "60vh" }}>
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-sm text-slate-800">Support Chat</span>
              <Badge className="text-xs bg-green-50 text-green-700">
                {conversations[0]?.status === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
            {msgsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !messages || messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                Send a message to start the conversation
              </div>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      msg.senderRole === "user"
                        ? "bg-purple-600 text-white rounded-br-md"
                        : "bg-white text-slate-800 border rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                    <p className={`text-xs mt-1 ${msg.senderRole === "user" ? "text-purple-200" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t p-3 flex gap-2 bg-white flex-shrink-0">
            <Input
              data-testid="input-message"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sendMsg.isPending || !message.trim()}>
              {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
