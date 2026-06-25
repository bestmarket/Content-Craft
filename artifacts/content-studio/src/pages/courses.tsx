import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Loader2, Trash2, Eye, Zap, Clock, BarChart3,
  Users, GraduationCap, Sparkles, Globe, Lock, TrendingUp, FileText,
} from "lucide-react";

const DIFF_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
};

const STAGE_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  building: { label: "Generating…", color: "text-violet-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  complete: { label: "Ready", color: "text-emerald-500", icon: <Zap className="w-3 h-3" /> },
  failed: { label: "Failed", color: "text-red-500", icon: <span>!</span> },
};

export default function CoursesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.get("/courses").then(r => r.data),
    refetchInterval: ({ state }: any) => {
      const courses: any[] = state?.data?.courses ?? [];
      return courses.some((c) => c.stage === "building") ? 4000 : false;
    },
  });

  const courses: any[] = data?.courses ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/courses/${id}`),
    onMutate: (id) => setDeleting(id),
    onSettled: () => setDeleting(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const stats = {
    total: courses.length,
    complete: courses.filter((c) => c.stage === "complete").length,
    published: courses.filter((c) => c.isPublished).length,
    lessons: courses.reduce((s, c) => s + (c.lessonCount ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Builder</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered premium text courses with full marketing kits</p>
              </div>
            </div>
          </div>
          <Link href="/courses/create">
            <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 text-sm w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4" />
              Create New Course
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Courses", value: stats.total, icon: BookOpen, color: "from-violet-500 to-indigo-500" },
            { label: "Complete", value: stats.complete, icon: Zap, color: "from-emerald-500 to-teal-500" },
            { label: "Published", value: stats.published, icon: Globe, color: "from-blue-500 to-cyan-500" },
            { label: "Total Lessons", value: stats.lessons, icon: FileText, color: "from-amber-500 to-orange-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/50 dark:to-indigo-950/50 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
              Create your first AI-powered premium text course complete with landing page, marketing kit, and product image.
            </p>
            <Link href="/courses/create">
              <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
                <Sparkles className="w-4 h-4" /> Generate My First Course
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course: any) => {
              const stageInfo = STAGE_INFO[course.stage] ?? STAGE_INFO.building;
              const isBuilding = course.stage === "building";
              return (
                <div key={course.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  {/* Cover */}
                  <div className="relative h-40 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 overflow-hidden">
                    {course.coverImageUrl && (
                      <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover opacity-70" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {course.isPublished && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Live
                        </span>
                      )}
                      <span className={`bg-black/40 backdrop-blur text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${stageInfo.color}`}>
                        {stageInfo.icon} {stageInfo.label}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[course.difficulty] ?? DIFF_COLORS.beginner}`}>
                        {course.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1 line-clamp-2">
                      {isBuilding ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-violet-500 flex-shrink-0" />
                          Generating: {course.topic}
                        </span>
                      ) : course.title}
                    </h3>
                    {course.subtitle && !isBuilding && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{course.subtitle}</p>
                    )}
                    {isBuilding && (
                      <div className="mb-3">
                        <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "65%" }} />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI is writing your premium course…</p>
                      </div>
                    )}

                    {!isBuilding && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.moduleCount ?? 0} modules</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.lessonCount ?? 0} lessons</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${parseFloat(course.price ?? "97").toFixed(0)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      {course.stage === "complete" && (
                        <Link href={`/courses/${course.id}`} className="flex-1">
                          <button className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View Course
                          </button>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this course?")) deleteMutation.mutate(course.id);
                        }}
                        disabled={deleting === course.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        {deleting === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
