
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function CalmChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-calm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: data.message,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center gap-2 bg-geoalert-turquoise text-white">
        <Wind className="h-5 w-5" />
        <h2 className="text-lg font-medium">צ'אט מרגיע</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-geoalert-turquoise text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
                dir="rtl"
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתוב את תחושותיך..."
            className="flex-1"
            dir="rtl"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
          >
            שלח
          </Button>
        </form>
      </div>
    </div>
  );
}
