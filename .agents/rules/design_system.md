# Design System & UI Specifications

## 1. Visual Theme & Aesthetics
- **Style**: Ultra-clean, modern, B2B social network & directory.
- **Palette**:
  - Primary Blue: `#1A5CFF` (Hover: `#0043F0`, Focus/Light: `#EEF4FF`)
  - Background: Soft neutral `#F8FAFC`
  - Cards & Surfaces: `#FFFFFF`
  - Borders: `#E2E8F0`
  - Text: Primary `#0F172A`, Muted `#64748B`, Accent `#1A5CFF`
  - Status: Verified/Success `#059669` (Emerald), Error `#EF4444` (Rose)
- **Typography**: Inter (Google Fonts), weight range 400-800.
- **Elevation**: Soft, subtle card shadows (`0 4px 20px -2px rgba(0, 0, 0, 0.05)`).
- **Border Radius**: Cards 14px-16px, Buttons 10px-12px, Topic Chips & Badges pill/full.

## 2. Responsive Layout Behavior
- **Desktop (≥ 1024px)**:
  - Left navigation sidebar (width 256px, fixed position).
  - Centered feed column (max width 680px).
  - Right widget column for trending companies & directory links (width 320px).
- **Mobile (< 1024px)**:
  - Top header with logo, search shortcut, and notification bell.
  - Sticky bottom navigation bar (Home, Discover, center `+`, Directory, Profile).
  - **Center `+` Button**: Visible ONLY for logged-in `COMPANY` users.
- **Data States**: Every data view must implement loading skeletons, empty states, and error alerts.
