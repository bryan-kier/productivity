import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Announcement {
  message: string;
  updatedAt: string | null;
}

export default function AnnouncementBanner() {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: announcement } = useQuery<Announcement>({
    queryKey: ["/api/announcement"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/announcement");
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("PUT", "/api/announcement", { message });
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/announcement"] });
      await queryClient.refetchQueries({ queryKey: ["/api/announcement"] });
      setIsEditing(false);
      toast({ title: "Announcement updated" });
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (announcement) {
      setEditValue(announcement.message);
    }
  }, [announcement]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(announcement?.message || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(announcement?.message || "");
    setIsEditing(false);
  };

  const handleSave = () => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    updateMutation.mutate(editValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Don't show banner if there's no message and we're not editing
  if (!announcement?.message && !isEditing) {
    return (
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            <span>Click to set tomorrow's tone...</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="container mx-auto px-4 py-4">
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Megaphone className="w-4 h-4 mt-1.5 text-primary flex-shrink-0" />
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Set the tone for tomorrow..."
                className="min-h-[60px] resize-none text-sm"
                onBlur={() => {
                  // Small delay to allow button clicks
                  blurTimeoutRef.current = setTimeout(() => {
                    if (document.activeElement?.closest('[data-editing-controls]')) {
                      return;
                    }
                    handleSave();
                  }, 200);
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2" data-editing-controls>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                onMouseDown={(e) => {
                  // Prevent textarea blur when clicking button
                  e.preventDefault();
                }}
                disabled={updateMutation.isPending}
                className="h-8"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 group">
            <Megaphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                {announcement?.message || ""}
              </p>
            </div>
            <button
              onClick={handleStartEdit}
              className={cn(
                "flex-shrink-0 p-1.5 rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-background/50",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "focus:opacity-100 focus:outline-none"
              )}
              aria-label="Edit announcement"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


