import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "teacher" | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(role === "student" ? "/student" : "/teacher");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-primary-foreground/20"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">EduPulse</h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            AI-powered classroom engagement. Smarter questions, deeper understanding.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to continue to your dashboard</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setRole("student")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                role === "student"
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <BookOpen className={`h-6 w-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${role === "student" ? "text-primary" : "text-foreground"}`}>
                Student
              </span>
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                role === "teacher"
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Users className={`h-6 w-6 ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${role === "teacher" ? "text-primary" : "text-foreground"}`}>
                Teacher
              </span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                defaultValue="demo@edu.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                defaultValue="password"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={!role}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo mode — select a role and click Sign In
          </p>
        </motion.div>
      </div>
    </div>
  );
}
