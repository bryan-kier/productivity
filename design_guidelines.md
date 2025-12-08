# Design Guidelines: Dark-Themed To-Do List Application

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Todoist's dark mode and Notion's task management interface - both known for sleek dark themes and intuitive organization.

## Color Palette
- **Primary Background**: #1F1F1F (deep black)
- **Secondary Background**: #2D2D2D (charcoal)
- **Accent**: Replit orange (#FF8C00 or similar vibrant orange)
- **Success/Complete**: #10B981 (emerald green)
- **Text Primary**: #F9FAFB (off-white)
- **Text Subtle**: #6B7280 (grey)

## Typography
- **Font Families**: Inter for body text, SF Pro Display for headings
- **Hierarchy**: 
  - Task titles: 16px medium weight
  - Category headers: 18px semibold
  - Note titles: 16px medium
  - Body text: 14px regular
  - Subtle text (timestamps, labels): 12px regular with #6B7280

## Layout System
- **Spacing Units**: Tailwind units of 2, 4, 6, and 8 (p-2, p-4, m-6, gap-8)
- **Container**: Max-width 1400px with centered content
- **Grid System**: Split view with tasks (60% left) and notes (40% right bottom)
- **Border Radius**: 12px consistently across all cards and components

## Core Components

### Navigation
- Clean left sidebar (240px fixed width) with dark #1F1F1F background
- Category list with hover states using #2D2D2D
- Active category highlighted with orange accent border-left

### Floating Action Button (FAB)
- Centered + button at bottom center of viewport
- Vibrant orange accent background with white icon
- 56px diameter, elevated shadow (0 4px 12px rgba(0,0,0,0.4))
- Reveals task/note creation modal on click

### Task Cards
- Background: #2D2D2D with subtle shadow (0 2px 8px rgba(0,0,0,0.2))
- 12px border radius, 16px padding
- Checkbox on left (20px, accent orange when checked)
- Daily/Weekly label chips (small pills with orange outline, 8px padding)
- Hover: slight elevation increase (0 4px 12px rgba(0,0,0,0.3))

### Notes Section
- Similar card treatment as tasks
- Right side panel, bottom-aligned
- Category badge at top-right when assigned
- Rich text preview with subtle gradient fade at bottom

### Subtask Treatment
- Nested 32px from parent with connecting line (1px #6B7280)
- Slightly smaller font (14px), reduced opacity when parent incomplete

## Interactive States
- **Hover**: Background lightens to #333333, shadow increases
- **Active/Checked**: Accent orange with success green checkmark
- **Focus**: Orange outline ring (2px, 40% opacity)
- **Disabled**: 50% opacity, cursor not-allowed

## Animations
Use sparingly:
- Task completion: Checkbox scale (1.0 → 1.1 → 1.0) with 200ms ease
- Card hover: Transform translateY(-2px) with 150ms ease
- FAB click: Scale pulse (1.0 → 0.95 → 1.0)

## Spacing & Rhythm
- Section padding: py-6 to py-8
- Card gaps: gap-4 between cards
- Content padding: p-4 to p-6 within cards
- List item spacing: space-y-2 for compact, space-y-4 for comfortable

## Images
No hero images needed - this is a productivity application focused on functionality. Use simple iconography from Heroicons throughout.