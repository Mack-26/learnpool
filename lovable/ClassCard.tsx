import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  name: string;
  professor: string;
  status: "live" | "upcoming" | "past";
  students?: number;
  onClick: () => void;
}

export default function ClassCard({ name, professor, status, students, onClick }: ClassCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-xl border border-border bg-card card-shadow hover:hover-shadow transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {name.charAt(0)}
        </div>
        <Badge
          variant={status === "live" ? "default" : "secondary"}
          className={cn(
            "text-xs",
            status === "live" && "gradient-primary text-primary-foreground border-0 animate-pulse",
            status === "upcoming" && "bg-accent text-accent-foreground",
            status === "past" && "bg-muted text-muted-foreground"
          )}
        >
          {status === "live" ? "● Live" : status === "upcoming" ? "Upcoming" : "Past Session"}
        </Badge>
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground">{professor}</p>
      {students !== undefined && (
        <p className="text-xs text-muted-foreground mt-2">{students} students enrolled</p>
      )}
    </button>
  );
}
