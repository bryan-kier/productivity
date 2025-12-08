import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

export type RefreshType = "daily" | "weekly" | "none";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  refreshType: RefreshType;
  categoryId?: string;
  subtasks: Subtask[];
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string) => void;
}

export default function TaskCard({ task, onToggle, onToggleSubtask, onAddSubtask }: TaskCardProps) {
  const [expanded, setExpanded] = useState(task.subtasks.length > 0);

  return (
    <Card 
      className="p-4 hover-elevate transition-all duration-150"
      data-testid={`card-task-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-0.5 data-[state=checked]:bg-success data-[state=checked]:border-success"
          data-testid={`checkbox-task-${task.id}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className={`text-base font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
              data-testid={`text-task-title-${task.id}`}
            >
              {task.title}
            </span>
            {task.refreshType !== "none" && (
              <Badge 
                variant="outline" 
                className="text-xs border-primary text-primary"
                data-testid={`badge-refresh-${task.id}`}
              >
                {task.refreshType === "daily" ? "Daily" : "Weekly"}
              </Badge>
            )}
          </div>
          
          {task.subtasks.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 -ml-1 text-muted-foreground"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-expand-subtasks-${task.id}`}
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="text-xs ml-1">{task.subtasks.length} subtasks</span>
              </Button>
              
              {expanded && (
                <div className="mt-2 ml-2 pl-4 border-l border-muted-foreground/30 space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                        data-testid={`checkbox-subtask-${subtask.id}`}
                      />
                      <span 
                        className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""} ${!task.completed ? "" : "opacity-50"}`}
                        data-testid={`text-subtask-title-${subtask.id}`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {onAddSubtask && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onAddSubtask(task.id)}
            data-testid={`button-add-subtask-${task.id}`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
