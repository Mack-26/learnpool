import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ReportsProps {
  role: "student" | "teacher";
}

const weakTopics = ["Net Present Value", "CAPM Model", "Bond Pricing"];
const strongTopics = ["Time Value of Money", "Risk vs Return", "Financial Statements"];

const heatmapData = [
  ["TVM", "Risk", "NPV", "IRR", "WACC"],
  [90, 75, 40, 55, 30],
];

const classQuestions = [
  { q: "How does CAPM relate to portfolio theory?", answers: 3, citations: 5, students: 8 },
  { q: "Can you explain bond duration simply?", answers: 2, citations: 3, students: 12 },
  { q: "What is the difference between NPV and IRR?", answers: 4, citations: 7, students: 6 },
];

function HeatmapGrid() {
  const colors = (val: number) => {
    if (val >= 80) return "bg-success/20 text-success";
    if (val >= 60) return "bg-primary/15 text-primary";
    if (val >= 40) return "bg-warning/20 text-warning";
    return "bg-destructive/15 text-destructive";
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {heatmapData[0].map((topic, i) => (
        <div key={topic} className="text-center">
          <div className={`rounded-lg p-4 text-sm font-medium ${colors(heatmapData[1][i] as number)}`}>
            {heatmapData[1][i]}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">{topic}</p>
        </div>
      ))}
    </div>
  );
}

export default function Reports({ role }: ReportsProps) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const backPath = role === "student" ? `/student/class/${classId}` : `/teacher/class/${classId}`;

  return (
    <DashboardLayout role={role}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button
          onClick={() => navigate(backPath)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Reports</h1>

        <Tabs defaultValue="personal" className="max-w-4xl">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">
              {role === "student" ? "Class Report" : "Summarized Report"}
            </TabsTrigger>
            <TabsTrigger value="class">
              {role === "student" ? "Detailed View" : "Full Report"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {role === "student" ? (
              <>
                {/* Heatmap */}
                <div className="p-5 rounded-xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-4">Confusion Heatmap</h3>
                  <HeatmapGrid />
                </div>

                {/* Class questions */}
                <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                  <h3 className="font-semibold text-foreground mb-2">Top Class Questions</h3>
                  {classQuestions.map((q, i) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{q.q}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {q.citations} citations
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {q.students} students
                          </Badge>
                        </div>
                      </div>
                      <button className="text-xs text-primary hover:underline shrink-0 ml-2">
                        Chat →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Teacher summarized */}
                <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                  <h3 className="font-semibold text-foreground">Top Questions This Session</h3>
                  {classQuestions.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium text-foreground mb-2">{q.q}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{q.answers} AI answers</span>
                        <span>{q.citations} citations</span>
                        <span>{q.students} students asked</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 rounded-xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-4">Engagement Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Questions Asked", value: "47" },
                      { label: "Active Students", value: "38/45" },
                    ].map((m) => (
                      <div key={m.label} className="text-center p-3 rounded-lg bg-muted">
                        <p className="text-2xl font-bold text-foreground">{m.value}</p>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="class" className="space-y-6">
            {/* Heatmap for both */}
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-4">Confusion Heatmap</h3>
              <HeatmapGrid />
            </div>

            {/* Class questions */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-semibold text-foreground mb-2">Top Class Questions</h3>
              {classQuestions.map((q, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{q.q}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {q.citations} citations
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {q.students} students
                      </Badge>
                    </div>
                  </div>
                  {role === "student" && (
                    <button className="text-xs text-primary hover:underline shrink-0 ml-2">
                      Chat →
                    </button>
                  )}
                </div>
              ))}
            </div>

            {role === "teacher" && (
              <div className="flex gap-3">
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Send className="h-4 w-4 mr-2" /> Send masked report to students
                </Button>
                <Button variant="outline">Send to Selected</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
