"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { TimeEntryForm } from "@/components/time-tracking/time-entry-form";
import { TimeEntryList } from "@/components/time-tracking/time-entry-list";
import { BudgetProgress } from "@/components/time-tracking/budget-progress";
import { getTimeEntries, getTimeEntrySummary } from "@/lib/actions/time-entries";
import { getProject } from "@/lib/actions/projects";
import type { TimeEntry, Project } from "@/types/database";
import type { TimeEntrySummary } from "@/lib/actions/time-entries";

export default function ProjectTimePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeEntrySummary>({ totalMinutes: 0, totalAmount: 0, currentMonthMinutes: 0 });
  const [project, setProject] = useState<Project | null>(null);
  const [, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const [e, s, p] = await Promise.all([
        getTimeEntries(projectId),
        getTimeEntrySummary(projectId),
        getProject(projectId),
      ]);
      setEntries(e);
      setSummary(s);
      setProject(p as Project | null);
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [projectId]);

  const totalHours = (summary.totalMinutes / 60).toFixed(1);
  const monthHours = (summary.currentMonthMinutes / 60).toFixed(1);

  return (
    <div>
      {/* Budget progress */}
      {project && (
        <BudgetProgress project={project} summary={summary} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">總工時</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{monthHours}h</p>
          <p className="text-xs text-muted-foreground">本月工時</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold">${summary.totalAmount.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">總金額</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          時間記錄
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          新增
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-white p-4 mb-4">
          <h3 className="text-sm font-medium mb-3">新增時間記錄</h3>
          <TimeEntryForm
            projectId={projectId}
            onSuccess={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Entry list */}
      <TimeEntryList
        entries={entries}
        projectId={projectId}
      />
    </div>
  );
}
