# 06. Component Library & Accessibility Standards

## Component Library Guidelines
All frontend interfaces must be composed from the centralized AegisOS Design System (Tailwind + Radix UI/Lucide).
- **Composition Rules**: Adhere strictly to atomic design principles. Do not construct monolithic screens; compose them from verifiable primitive components.
- **State Management**: Zustand handles global state (e.g., NavigationService), while React context handles local view state. 
- **Loading & Error States**: Every data-fetching component must implement Skeleton loaders and explicit Error Boundary fallbacks. Empty states must provide actionable next steps, not dead ends.
- **Design Tokens**: Standardized via Tailwind config (ar(--primary), ar(--accent), ar(--muted)). Hardcoded HEX/RGB values are forbidden.

## Accessibility Standards (WCAG 2.2 AA)
The Operator Experience is a critical workspace environment and must be accessible to all operators.
- **Keyboard Navigation**: All interactive elements must be focusable. Focus rings must be high-contrast and distinct. 
- **Screen Reader Support**: Use semantic HTML (<nav>, <main>, <aside>). Provide ria-label for all icon-only buttons.
- **Reduced Motion**: Respect prefers-reduced-motion media queries for animations (e.g., topology graph transitions).
- **Color Contrast**: Enforce strict minimum contrast ratios for text and UI boundaries.

## Responsive Design Strategy
- **Desktop & Ultra-wide**: Default layout. Utilizes the full 3-column architecture (Sidebar, Main Content, Secondary Details Pane).
- **Laptop & Tablet**: Adaptive layout. The secondary details pane converts to a slide-over modal.
- **Mobile**: Minimal layout. Focus on critical alerts and dashboard dials. Deep administrative actions (e.g., DAG editing) are disabled or read-only on mobile devices.
