import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

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
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  return (
    <Card 
      className="p-4 hover-elevate cursor-pointer transition-all duration-150"
      onClick={() => onClick?.(note)}
      data-testid={`card-note-${note.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="text-base font-medium truncate"
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
            className="text-sm text-muted-foreground mt-1 line-clamp-2"
            data-testid={`text-note-content-${note.id}`}
          >
            {note.content}
          </p>
        </div>
      </div>
    </Card>
  );
}
