import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  BookOpen,
  Zap,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  X,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  citation?: string;
  confidence?: number;
  timestamp: string;
}

const pastMessages: Message[] = [
  {
    id: "p1",
    role: "user",
    content: "What is the time value of money?",
    timestamp: "Last session",
  },
  {
    id: "p2",
    role: "ai",
    content:
      "The time value of money (TVM) is a financial concept stating that a sum of money has greater value now than the same sum in the future due to its earning potential.",
    citation: "Brealey, Myers & Allen, Ch. 2",
    confidence: 94,
    timestamp: "Last session",
  },
];

const nudgeData = {
  count: 12,
  question: "Can you explain net present value with a real-world example?",
};

export default function ChatSession() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: "Now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Great question! Here's what I found about "${input.slice(0, 40)}..."\n\nThis concept relates to fundamental principles in ${classId || "this course"}. The key insight is that understanding this helps build a foundation for more advanced topics.`,
        citation: "Course Material, Section 4.2",
        confidence: Math.floor(Math.random() * 15) + 85,
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <button
              onClick={() => navigate(`/student/class/${classId}`)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground">
              Live Session — {classId?.charAt(0).toUpperCase()}{classId?.slice(1)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {anonymous ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-primary" />
              )}
              <span className="text-muted-foreground">Anonymous</span>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/student/class/${classId}`)}
            >
              <LogOut className="h-4 w-4 mr-1" /> Leave
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Past chat history sidebar */}
          <div className="hidden lg:flex flex-col w-80 border border-border rounded-xl bg-card overflow-hidden">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Previous Sessions</h3>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {pastMessages.map((msg) => (
                <div key={msg.id} className={`text-sm ${msg.role === "ai" ? "pl-3 border-l-2 border-primary/30" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {msg.role === "user" ? "You" : "AI"} · {msg.timestamp}
                  </p>
                  <p className="text-foreground">{msg.content}</p>
                  {msg.citation && (
                    <p className="text-xs text-primary mt-1">📚 {msg.citation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main chat */}
          <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium text-foreground">Ask anything</p>
                    <p className="text-sm mt-1">AI will answer with citations from course material</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.citation && (
                      <p className="text-xs mt-2 opacity-80">📚 {msg.citation}</p>
                    )}
                    {msg.confidence !== undefined && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-foreground/10">
                        <Badge variant="secondary" className="text-xs">
                          {msg.confidence}% confident
                        </Badge>
                        <button className="text-xs hover:underline flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Explain simply
                        </button>
                        <button className="text-xs hover:underline flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Deep dive
                        </button>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: "up" }))}
                            className={`p-1 rounded hover:bg-foreground/10 transition-colors ${feedback[msg.id] === "up" ? "text-success" : "opacity-50 hover:opacity-100"}`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setFeedback((prev) => ({ ...prev, [msg.id]: "down" }))}
                            className={`p-1 rounded hover:bg-foreground/10 transition-colors ${feedback[msg.id] === "down" ? "text-destructive" : "opacity-50 hover:opacity-100"}`}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="gradient-primary text-primary-foreground shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Participation Nudge */}
        <AnimatePresence>
          {showNudge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 max-w-sm p-4 rounded-xl bg-card border border-primary/30 elevated-shadow z-50"
            >
              <button
                onClick={() => setShowNudge(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {nudgeData.count} students have similar confusion
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    "{nudgeData.question}"
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowNudge(false)}>
                      Raise anonymously
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowNudge(false)}>
                      Raise with name
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowNudge(false)}>
                      Keep private
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
