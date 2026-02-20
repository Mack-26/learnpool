import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, UserCircle } from "lucide-react";

interface ChatContact {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const contacts: ChatContact[] = [
  { id: "s1", name: "Student #A7X2", lastMessage: "Did you understand the NPV example?", time: "2m ago", unread: 2 },
  { id: "s2", name: "Student #K9M1", lastMessage: "Want to study for the exam together?", time: "1h ago", unread: 0 },
  { id: "s3", name: "Student #P3Q8", lastMessage: "I shared my notes on CAPM", time: "3h ago", unread: 1 },
];

const chatMessages = [
  { id: "1", from: "them", text: "Hey! Did you understand the NPV example from today's session?" },
  { id: "2", from: "me", text: "Kind of, but I'm confused about the discount rate part" },
  { id: "3", from: "them", text: "Same! Want to work through it together? I found a good practice problem" },
];

export default function StudentChat() {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<string | null>("s1");
  const [input, setInput] = useState("");

  return (
    <DashboardLayout role="student">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-[calc(100vh-8rem)]"
      >
        <h1 className="text-2xl font-bold text-foreground mb-4">Study Chat</h1>

        <div className="flex gap-4 h-[calc(100%-3rem)]">
          {/* Contact list */}
          <div className="w-72 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border">
              <Input placeholder="Search connections..." className="h-8 text-sm" />
            </div>
            <div className="flex-1 overflow-auto">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c.id)}
                  className={`w-full text-left p-3 border-b border-border transition-colors ${
                    selectedContact === c.id ? "bg-accent" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <span className="text-xs text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="gradient-primary text-primary-foreground border-0 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {c.unread}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
            {selectedContact ? (
              <>
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {contacts.find((c) => c.id === selectedContact)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Anonymous until both accept</p>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          msg.from === "me"
                            ? "gradient-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setInput("");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" className="gradient-primary text-primary-foreground shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
