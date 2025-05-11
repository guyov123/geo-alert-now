
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

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
  const [isOpen, setIsOpen] = useState(false);

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
      // שימוש ב-supabase.functions.invoke במקום fetch ישיר
      const { data, error } = await supabase.functions.invoke('chat-calm', {
        body: { message: input.trim() }
      });
      
      if (error) {
        throw new Error(error.message || "שגיאת שרת לא ידועה");
      }
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: data.message,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      
      // הוספת הודעת שגיאה לצ'אט
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: "מצטער, נתקלתי בבעיה בתקשורת עם המערכת. ייתכן שחרגת ממכסת השימוש ב-API. אנא נסה שוב מאוחר יותר.",
        isUser: false,
        timestamp: new Date()
      }]);
      
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "ייתכן שחרגת ממכסת השימוש ב-OpenAI API או שיש תקלה זמנית",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="rounded-full p-4 h-14 w-14 bg-geoalert-turquoise hover:bg-geoalert-turquoise/90"
            size="icon"
          >
            <Wind className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[600px] max-w-md p-0">
          <DialogHeader className="p-4 border-b bg-geoalert-turquoise">
            <DialogTitle className="text-white flex items-center gap-2 text-right">
              <Wind className="h-5 w-5" />
              צ'אט מרגיע
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4 h-[calc(100%-8rem)]">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>שלום! אני כאן כדי לעזור לך להירגע ולהתמודד עם מצבי לחץ.</p>
                  <p>איך אני יכול לעזור לך היום?</p>
                </div>
              )}
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

          <div className="p-4 border-t mt-auto">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
