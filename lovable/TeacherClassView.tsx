import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Play, BarChart3, Settings, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function TeacherClassView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const className = classId ? classId.charAt(0).toUpperCase() + classId.slice(1) : "Class";
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionCode = "EDU-" + (classId || "").toUpperCase().slice(0, 3) + "-2024";

  return (
    <DashboardLayout role="teacher">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button
          onClick={() => navigate("/teacher")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">{className}</h1>
        <p className="text-muted-foreground mb-8">Manage your class</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-4xl">
          {/* Start Session */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="p-6 rounded-xl border-2 border-primary/30 bg-accent"
          >
            <div className="h-12 w-12 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center mb-4">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Start Session</h3>
            <p className="text-sm text-muted-foreground mb-4">Launch a live class session</p>

            {sessionStarted ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="gradient-primary text-primary-foreground border-0 animate-pulse">● Live</Badge>
                  <span className="text-sm text-muted-foreground">
                    <Users className="h-3 w-3 inline mr-1" />
                    23 active
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <code className="text-sm font-mono text-foreground flex-1">{sessionCode}</code>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionStarted(false)}
                  className="w-full"
                >
                  End Session
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setSessionStarted(true)}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              >
                Start Now
              </Button>
            )}
          </motion.div>

          {/* Reports */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate(`/teacher/class/${classId}/reports`)}
            className="p-6 rounded-xl border-2 border-border bg-card text-left hover:border-primary/40 hover:hover-shadow transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Reports</h3>
            <p className="text-sm text-muted-foreground">View class analytics and engagement data</p>
          </motion.button>

          {/* Settings */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            onClick={() => navigate("/teacher/settings")}
            className="p-6 rounded-xl border-2 border-border bg-card text-left hover:border-primary/40 hover:hover-shadow transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Settings className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Settings</h3>
            <p className="text-sm text-muted-foreground">Configure AI behavior and class preferences</p>
          </motion.button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
