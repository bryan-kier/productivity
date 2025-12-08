import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Edit, Trash2, Save, X as XIcon } from "lucide-react";
import { Category } from "./CategorySidebar";

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  categoryName?: string;
}

interface NoteCardProps {
  note: Note;
  onClick?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  categories?: Category[];
  onUpdateNote?: (id: string, updates: { title?: string; content?: string; categoryId?: string | null }) => void;
}

export default function NoteCard({ note, onClick, onEdit, onDelete, categories = [], onUpdateNote }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategoryId, setEditCategoryId] = useState<string>(note.categoryId || "");
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Reset edit state when note changes or dialog closes
  useEffect(() => {
    if (!isExpanded) {
      setIsEditing(false);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditCategoryId(note.categoryId || "");
    }
  }, [note, isExpanded]);

  const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setIsExpanded(true);
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If it was a long press, prevent the onClick from firing
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if it wasn't a long press
    if (!isLongPress.current && onClick) {
      onClick(note);
    }
    isLongPress.current = false;
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategoryId(note.categoryId || "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategoryId(note.categoryId || "");
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !onUpdateNote) return;
    
    onUpdateNote(note.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      categoryId: editCategoryId || null,
    });
    
    setIsEditing(false);
  };

  return (
    <>
      <Card 
        className="p-4 hover-elevate transition-all duration-150 group"
        data-testid={`card-note-${note.id}`}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10" onClick={(e) => {
            e.stopPropagation();
            onClick?.(note);
          }}>
            <FileText className="w-4 h-4 text-primary cursor-pointer" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="text-base font-medium truncate cursor-pointer"
                data-testid={`text-note-title-${note.id}`}
              >
                {note.title}
              </span>
              {note.categoryName && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`badge-category-${note.id}`}
                >
                  {note.categoryName}
                </Badge>
              )}
            </div>
            <p 
              className="text-sm text-muted-foreground mt-1 line-clamp-2 cursor-pointer"
              data-testid={`text-note-content-${note.id}`}
            >
              {note.content}
            </p>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                data-testid={`button-edit-note-${note.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                data-testid={`button-delete-note-${note.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isExpanded} onOpenChange={(open) => {
        setIsExpanded(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] flex flex-col p-0 gap-0 left-[5vw] top-[5vh] translate-x-0 translate-y-0 rounded-lg">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              {isEditing ? (
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expanded-note-title">Note Title</Label>
                    <Input
                      id="expanded-note-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-semibold"
                      autoFocus
                    />
                  </div>
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="expanded-note-category">Category</Label>
                      <Select value={editCategoryId || "none"} onValueChange={(value) => setEditCategoryId(value === "none" ? "" : value)}>
                        <SelectTrigger id="expanded-note-category" className="w-full sm:w-[200px]">
                          <SelectValue placeholder="No Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl font-semibold truncate">
                      {note.title}
                    </DialogTitle>
                    {note.categoryName && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs mt-2"
                      >
                        {note.categoryName}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleCancelEdit}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleSaveEdit}
                      disabled={!editTitle.trim()}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {onUpdateNote && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit();
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && !onUpdateNote && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(false);
                          onEdit(note);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(false);
                          onDelete(note.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expanded-note-content">Content</Label>
                  <Textarea
                    id="expanded-note-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[400px] resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
