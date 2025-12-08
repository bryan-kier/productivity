import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash2 } from "lucide-react";

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
}

export default function NoteCard({ note, onClick, onEdit, onDelete }: NoteCardProps) {
  return (
    <Card 
      className="p-4 hover-elevate transition-all duration-150 group"
      data-testid={`card-note-${note.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10" onClick={() => onClick?.(note)}>
          <FileText className="w-4 h-4 text-primary cursor-pointer" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onClick?.(note)}>
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
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
}
