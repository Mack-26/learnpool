import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import ClassCard from "@/components/ClassCard";

const classes = [
  { id: "finance", name: "Finance", professor: "Dr. Sarah Chen (You)", status: "live" as const, students: 45 },
  { id: "marketing", name: "Marketing", professor: "Prof. James Miller (You)", status: "upcoming" as const, students: 38 },
  { id: "operations", name: "Operations", professor: "Dr. Lisa Park (You)", status: "past" as const, students: 52 },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout role="teacher">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">My Classes</h1>
        <p className="text-muted-foreground mb-6">Manage your classes and sessions</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
            >
              <ClassCard
                name={cls.name}
                professor={cls.professor}
                status={cls.status}
                students={cls.students}
                onClick={() => navigate(`/teacher/class/${cls.id}`)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
