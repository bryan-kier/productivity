import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Calendar, MoreVertical } from "lucide-react";

export type RefreshType = "daily" | "weekly" | "none";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  deadline?: Date | string | null;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  refreshType: RefreshType;
  categoryId?: string;
  categoryName?: string;
  subtasks: Subtask[];
  deadline?: Date | string | null;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onEditSubtask?: (subtask: Subtask) => void;
  onDeleteSubtask?: (id: string) => void;
  dragHandle?: React.ReactNode;
}

export default function TaskCard({ task, onToggle, onToggleSubtask, onAddSubtask, onEdit, onDelete, onEditSubtask, onDeleteSubtask, dragHandle }: TaskCardProps) {
  const [expanded, setExpanded] = useState(task.subtasks.length > 0);

  const taskDeadline = task.deadline ? (typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline) : null;
  const isOverdue = taskDeadline && !task.completed && isPast(taskDeadline) && !isToday(taskDeadline);
  const isDueToday = taskDeadline && !task.completed && isToday(taskDeadline);

  return (
    <Card 
      className="p-4 hover-elevate transition-all duration-150 group"
      data-testid={`card-task-${task.id}`}
    >
      <div className="space-y-2">
        {/* First row: drag handle, checkbox, chevron/toggle, title, +, 3 dots */}
        <div className="flex items-center gap-2 w-full">
          {dragHandle}
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task.id)}
            className="data-[state=checked]:bg-success data-[state=checked]:border-success flex-shrink-0"
            data-testid={`checkbox-task-${task.id}`}
          />
          {task.subtasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-muted-foreground flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              data-testid={`button-expand-subtasks-${task.id}`}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-xs ml-1">{task.subtasks.length}</span>
            </Button>
          )}
          <span 
            className={`text-base font-medium flex-1 min-w-0 ${task.completed ? "line-through text-muted-foreground" : ""}`}
            data-testid={`text-task-title-${task.id}`}
          >
            {task.title}
          </span>
          {onAddSubtask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddSubtask(task.id);
              }}
              data-testid={`button-add-subtask-${task.id}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-task-menu-${task.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    data-testid={`button-edit-task-${task.id}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="text-destructive"
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Second row: category, repeat, deadline */}
        {(task.categoryName || task.refreshType !== "none" || taskDeadline) && (
          <div className="flex items-center gap-2 flex-wrap w-full">
            {task.categoryName && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                data-testid={`badge-category-${task.id}`}
              >
                {task.categoryName}
              </Badge>
            )}
            {task.refreshType !== "none" && (
              <Badge 
                variant="outline" 
                className="text-xs border-primary text-primary"
                data-testid={`badge-refresh-${task.id}`}
              >
                {task.refreshType === "daily" ? "Daily" : "Weekly"}
              </Badge>
            )}
            {taskDeadline && (
              <Badge 
                variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"}
                className="text-xs flex items-center gap-1"
                data-testid={`badge-deadline-${task.id}`}
              >
                <Calendar className="w-3 h-3" />
                {format(taskDeadline, "MMM d")}
              </Badge>
            )}
          </div>
        )}
        
        {/* Subtasks section */}
        {task.subtasks.length > 0 && expanded && (
          <div className="mt-2 space-y-2 w-full">
                {task.subtasks.map((subtask) => {
                  const subtaskDeadline = subtask.deadline ? (typeof subtask.deadline === 'string' ? new Date(subtask.deadline) : subtask.deadline) : null;
                  const isSubtaskOverdue = subtaskDeadline && !subtask.completed && isPast(subtaskDeadline) && !isToday(subtaskDeadline);
                  const isSubtaskDueToday = subtaskDeadline && !subtask.completed && isToday(subtaskDeadline);
                  
                  return (
                    <div key={subtask.id} className="flex items-center gap-2 group/subtask w-full">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                        className="data-[state=checked]:bg-success data-[state=checked]:border-success flex-shrink-0"
                        data-testid={`checkbox-subtask-${subtask.id}`}
                      />
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span 
                          className={`text-sm break-words ${subtask.completed ? "line-through text-muted-foreground" : ""} ${!task.completed ? "" : "opacity-50"}`}
                          data-testid={`text-subtask-title-${subtask.id}`}
                        >
                          {subtask.title}
                        </span>
                        {subtaskDeadline && (
                          <Badge 
                            variant={isSubtaskOverdue ? "destructive" : isSubtaskDueToday ? "default" : "outline"}
                            className="text-xs flex items-center gap-1 flex-shrink-0"
                            data-testid={`badge-deadline-subtask-${subtask.id}`}
                          >
                            <Calendar className="w-3 h-3" />
                            {format(subtaskDeadline, "MMM d")}
                          </Badge>
                        )}
                      </div>
                      {(onEditSubtask || onDeleteSubtask) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-subtask-menu-${subtask.id}`}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEditSubtask && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSubtask(subtask);
                                }}
                                data-testid={`button-edit-subtask-${subtask.id}`}
                              >
                                <Edit className="w-3 h-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDeleteSubtask && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSubtask(subtask.id);
                                }}
                                className="text-destructive"
                                data-testid={`button-delete-subtask-${subtask.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </Card>
  );
}
