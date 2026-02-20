import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface SettingsProps {
  role: "student" | "teacher";
}

const personalities = [
  { value: "funny", label: "Funny", desc: "Light-hearted explanations with humor" },
  { value: "optimistic", label: "Optimistic", desc: "Encouraging and positive tone" },
  { value: "strict", label: "Strict Professor", desc: "Formal and academically rigorous" },
  { value: "supportive", label: "Supportive Tutor", desc: "Patient and step-by-step guidance" },
];

export default function Settings({ role }: SettingsProps) {
  const navigate = useNavigate();
  const [personality, setPersonality] = useState("supportive");
  const [depth, setDepth] = useState([50]);
  const [anonymousDefault, setAnonymousDefault] = useState(false);
  const [nudges, setNudges] = useState(true);

  const depthLabel =
    depth[0] <= 25 ? "Hints only" : depth[0] <= 60 ? "Guided explanation" : "Full explanation";

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl"
      >
        <button
          onClick={() => navigate(role === "student" ? "/student" : "/teacher")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="space-y-8">
          {/* AI Personality */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-4">AI Personality</h3>
            <RadioGroup value={personality} onValueChange={setPersonality} className="space-y-3">
              {personalities.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    personality === p.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={p.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {role === "teacher" && (
            <>
              {/* Depth Slider */}
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-1">AI Helpfulness</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Control how much detail AI provides
                </p>
                <Slider
                  value={depth}
                  onValueChange={setDepth}
                  min={0}
                  max={100}
                  step={1}
                  className="mb-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>20% Hints only</span>
                  <span className="font-medium text-foreground">{depth[0]}% — {depthLabel}</span>
                  <span>100% Full</span>
                </div>
              </div>
            </>
          )}

          {/* Toggles */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-semibold text-foreground mb-2">Preferences</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Default Anonymous Mode</Label>
                <p className="text-xs text-muted-foreground">Questions are anonymous by default</p>
              </div>
              <Switch checked={anonymousDefault} onCheckedChange={setAnonymousDefault} />
            </div>
            {role === "teacher" && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Participation Nudges</Label>
                  <p className="text-xs text-muted-foreground">
                    Show when students have common confusions
                  </p>
                </div>
                <Switch checked={nudges} onCheckedChange={setNudges} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
