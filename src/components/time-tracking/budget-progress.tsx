import type { TimeEntrySummary } from "@/lib/actions/time-entries";
import type { Project } from "@/types/database";

interface BudgetProgressProps {
  project: Pick<Project, "budget_amount" | "budget_type">;
  summary: TimeEntrySummary;
}

export function BudgetProgress({ project, summary }: BudgetProgressProps) {
  if (!project.budget_amount || !project.budget_type) return null;

  const used =
    project.budget_type === "hourly"
      ? summary.totalAmount
      : summary.totalAmount;

  const percentage = Math.min((used / project.budget_amount) * 100, 100);
  const isWarning = percentage >= 80;
  const isOverBudget = used > project.budget_amount;

  let barColor = "bg-blue-500";
  if (isOverBudget) barColor = "bg-red-500";
  else if (isWarning) barColor = "bg-amber-500";

  return (
    <div className="rounded-lg border border-border bg-white p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">預算使用情況</p>
        <p className="text-sm text-muted-foreground">
          {project.budget_type === "hourly"
            ? `${(summary.totalMinutes / 60).toFixed(1)} hrs`
            : `$${used.toFixed(2)}`}
          {" / "}
          {project.budget_type === "hourly"
            ? `${(project.budget_amount / 1).toFixed(0)} hrs budget`
            : `$${project.budget_amount.toFixed(2)}`}
        </p>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOverBudget && (
        <p className="text-xs text-red-600 mt-1 font-medium">
          已超出預算 ${(used - project.budget_amount).toFixed(2)}
        </p>
      )}
      {isWarning && !isOverBudget && (
        <p className="text-xs text-amber-600 mt-1">
          已使用 {percentage.toFixed(0)}% 預算，請留意
        </p>
      )}
    </div>
  );
}
