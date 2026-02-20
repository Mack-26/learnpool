import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Radio, BarChart3, MessageSquare, Settings } from "lucide-react";

const options = [
  {
    title: "Join Session",
    description: "Enter the live class session and interact with AI",
    icon: Radio,
    path: "session",
    accent: true,
  },
  {
    title: "Reports",
    description: "View your learning analytics and class insights",
    icon: BarChart3,
    path: "reports",
  },
  {
    title: "Student Chat",
    description: "Chat with classmates for study discussions",
    icon: MessageSquare,
    pathOverride: "/student/chat",
  },
  {
    title: "Settings",
    description: "Customize AI personality and preferences",
    icon: Settings,
    pathOverride: "/student/settings",
  },
];

export default function StudentClassView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const className = classId ? classId.charAt(0).toUpperCase() + classId.slice(1) : "Class";

  return (
    <DashboardLayout role="student">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button
          onClick={() => navigate("/student")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">{className}</h1>
        <p className="text-muted-foreground mb-8">Choose an action</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {options.map((opt, i) => (
            <motion.button
              key={opt.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              onClick={() =>
                navigate(opt.pathOverride || `/student/class/${classId}/${opt.path}`)
              }
              className={`p-6 rounded-xl border-2 text-left transition-all group ${
                opt.accent
                  ? "border-primary/30 bg-accent hover:border-primary hover:hover-shadow"
                  : "border-border bg-card hover:border-primary/40 hover:hover-shadow"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  opt.accent
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <opt.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">{opt.title}</h3>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
