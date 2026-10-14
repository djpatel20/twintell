# Twintell Design System (DESIGN.md)

> Source of truth for every UI change in this repo. AI agents and humans must read this file
> before creating or editing any page, component, or style. If a change needs something this file
> does not cover, add it here first, then build it.

---

## 1. Product & audience

Twintell is a B2B social network + business directory for verified Indian companies:
manufacturers, wholesalers, D2C brands, suppliers, and procurement teams.

- **Primary user:** a business owner or procurement person scanning for suppliers, buyers, and
  industry news between other work. They are busy, practical, and trust signals matter to them.
- **Primary job of the UI:** help people find trustworthy trade partners fast and start a
  conversation.
- **Personality:** a well-run trade floor. Confident, organised, warm, and busy, never playful or
  "startup-cute". Think trade ledger meets modern social feed.

Every design decision should make one of these clearer: *who is this company, can I trust them,
what do they sell/need, how do I contact them.*

---

## 2. Design principles

1. **Trust is visible.** Verification tier, business type, location, and years active are shown
   wherever a company appears. Never hide them behind a click.
2. **Trade data over decoration.** Structure (MOQ, price range, category, location) is the visual
   interest. Do not add gradients, blobs, or illustrations to fill space.
3. **One loud thing per screen.** Each page has one primary action in Cobalt. Everything else is
   quiet: neutral buttons, ink text, hairline borders.
4. **Hierarchy through radius and weight, not shadows.** Bigger containers get smaller radii;
   small interactive pieces get rounder. Shadows only for things that float (menus, modals, toasts).
5. **Dense but breathable.** B2B users scan. Use compact rows and tight metadata, with generous
   space between groups.
6. **Consistent vocabulary.** An action keeps its name everywhere: "Send enquiry" button →
   "Enquiry sent" toast → "Enquiries" tab.

---

## 3. Color tokens

Define once as CSS variables in `globals.css`, map into Tailwind. **Never hard-code hex values in
components.**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | `#14213D` | `#E8ECF5` | Primary text, headings, icons |
| `--ink-muted` | `#5A6478` | `#9AA3B5` | Secondary text, metadata |
| `--ink-faint` | `#8B93A5` | `#6B7487` | Placeholders, timestamps |
| `--surface` | `#F4F5F7` | `#0F1626` | App background |
| `--panel` | `#FFFFFF` | `#172033` | Cards, sidebars, inputs |
| `--panel-sunk` | `#EEF0F4` | `#1D2840` | Input fill, segmented controls, table headers |
| `--line` | `#E2E5EB` | `#26324A` | Borders, dividers |
| `--cobalt` | `#2B44D6` | `#6C82FF` | Brand, primary action, active nav, links |
| `--cobalt-soft` | `#ECEFFD` | `#1E2A55` | Active nav background, selected chips |
| `--amber` | `#E59A1F` | `#F2B24C` | Verified/Gold tier, featured deals. Max 1–2 uses per viewport |
| `--amber-soft` | `#FDF3E1` | `#3A2C12` | Background behind amber badges |
| `--green` | `#1E9466` | `#3DC48E` | Success, "In stock", online, enquiry accepted |
| `--red` | `#D23F3F` | `#F06A6A` | Errors, destructive actions, unread counts |

### Category colors (industry stripe + chip dot only, never full backgrounds)

| Category | Token | Hex |
|---|---|---|
| Manufacturing | `--cat-mfg` | `#4C5BD4` |
| Business News | `--cat-news` | `#5A6478` |
| Products | `--cat-products` | `#1E9466` |
| Wholesale | `--cat-wholesale` | `#C27A12` |
| D2C / Brands | `--cat-d2c` | `#C2417A` |
| Technology | `--cat-tech` | `#2B8FB8` |

**Rules:** Cobalt is for the one primary action and active states only. Amber only means "verified
premium / featured". Category colors appear as a 3px stripe or 8px dot, never as text on white
below 4.5:1 contrast.

---

## 4. Typography

- **Display / headings:** `Bricolage Grotesque` (600, 700). Slightly condensed, characterful.
- **Body / UI:** `IBM Plex Sans` (400, 500, 600). Industrial, very legible at small sizes.
- **Numbers:** IBM Plex Sans with `font-variant-numeric: tabular-nums` for prices, MOQ, counts.
- Load via `next/font/google`, expose as `--font-display` and `--font-body`.
- Fallback stack: `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`.

| Role | Font | Size / line-height | Weight | Tailwind |
|---|---|---|---|---|
| Page title | Display | 28 / 34 | 700 | `text-[28px] leading-[34px]` |
| Section title | Display | 20 / 26 | 600 | `text-xl` |
| Card title (company name) | Body | 15 / 20 | 600 | `text-[15px]` |
| Body | Body | 15 / 24 | 400 | `text-[15px] leading-6` |
| UI label / button | Body | 14 / 20 | 500 | `text-sm font-medium` |
| Metadata | Body | 13 / 18 | 400 | `text-[13px]` |
| Micro (badges) | Body | 12 / 16 | 500 | `text-xs font-medium` |

**Rules**
- Sentence case everywhere. No ALL-CAPS labels or tracked-out eyebrows.
- Do not color or italicise a single word inside a headline.
- Body text max width ~70 characters (`max-w-prose`).
- Metadata separated by spacing or a thin vertical rule, not strings of "•".

---

## 5. Spacing, radius, elevation

**Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 48. Nothing else.
- Inside cards: 20 (desktop), 16 (mobile).
- Between feed cards: 12.
- Between page sections: 32.

**Radius hierarchy** (bigger thing = smaller radius):
| Element | Radius |
|---|---|
| Page panels, feed cards, modals | `10px` (`rounded-[10px]`) |
| Inputs, buttons, dropdowns | `8px` (`rounded-lg`) |
| Badges, chips, segmented pills | `999px` (`rounded-full`) |
| Avatars (people) | circle |
| Company logos | `8px` square, so companies and people are distinguishable at a glance |

**Elevation**
- Default cards: `1px solid var(--line)`, no shadow.
- Hover on clickable cards: border becomes `--ink-faint`. No lift, no shadow.
- Floating layers only (menus, popovers, modals, toasts):
  `0 8px 24px -8px rgb(20 33 61 / 0.18), 0 2px 6px -2px rgb(20 33 61 / 0.08)`.

---

## 6. Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Top bar: logo | search (wide, ⌘K hint) | Post RFQ | msgs | bell | me │
├────────────┬───────────────────────────────────┬─────────────────────┤
│ Left nav   │ Feed column (max 640px)           │ Right rail (320px)  │
│ 240px      │ - Welcome / quick actions strip   │ - Your company card │
│ sticky     │ - Composer                        │ - Open RFQs for you │
│            │ - Tabs + category filter          │ - Suppliers to      │
│ company    │ - Posts                           │   follow            │
│ switcher   │                                   │ - Trending in your  │
│ at bottom  │                                   │   categories        │
└────────────┴───────────────────────────────────┴─────────────────────┘
```

- Container: `max-w-[1280px] mx-auto`, gutters 24px.
- ≥1280: 3 columns. 1024–1279: hide right rail, show its key blocks inline in feed every ~6 posts.
  <1024: left nav becomes bottom tab bar (Home, Discover, Post, Messages, Profile).
- Content is left-aligned. Never center-align body text or feed content.
- Left nav and right rail are `sticky top-[72px]`.

---

## 7. Components

### Buttons
| Variant | Style | Use |
|---|---|---|
| Primary | `bg-cobalt text-white`, hover darken 8% | One per view |
| Secondary | `bg-panel border-line text-ink`, hover `bg-panel-sunk` | Most actions |
| Ghost | transparent, `text-ink-muted`, hover `bg-panel-sunk` | Toolbar/icon actions |
| Danger | `text-red`, border on hover | Delete, report |

Height 36 (default), 32 (compact), 44 (mobile primary). Icon 16px, 8px gap. Label says exactly what
happens: "Send enquiry", "Follow", "Post update". Never "Submit" or "Click here".

### Company identity block (used everywhere a company appears)
```
[logo 40px sq] Sigma Solve  [✓ Verified]
               Wholesaler | Ahmedabad, Gujarat | 1d
```
- Logo: 8px radius square, initials on category-tinted background if no logo.
- Verification badge: `✓ Verified` (green outline) or `★ Gold` (amber-soft background). Always
  next to the name.
- Business type + location + time on one metadata line.

### Feed post card
- Panel, 10px radius, 1px border, 3px left stripe in the post's category color.
- Header: company identity block + category chip (dot + label) + overflow menu.
- Body: text max 4 lines collapsed with "Show more". Media full card width, 8px radius.
- **Product posts** add a trade strip below body on `--panel-sunk`:
  `MOQ 500 pcs | ₹120–₹180 / unit | Ships pan-India | [Send enquiry]`
- **RFQ posts** add: `Need: 2,000 m cotton fabric | Budget ₹… | Closes in 3 days | [Quote now]`
- Footer: Like, Comment, Share as ghost buttons with counts; Save on the right.
- Liked state: heart fills `--red`, count animates once (150ms scale). No other motion.

### Composer
- Shows "Posting as [company logo] Sigma Solve ▾" (company switcher).
- Collapsed: single input. Expanded on focus: post type tabs (Update, Product, RFQ, News),
  attach media, category select, primary "Post update" button.

### Tabs & category filter
- Feed tabs: segmented control on `--panel-sunk`, active segment `--panel` + ink text (not cobalt
  fill).
- Category chips: horizontal scroll, no visible scrollbar, fade mask at edges. Each chip has its
  category dot. Selected chip: `--cobalt-soft` background, cobalt text.

### Badges
- `Verified` – green, outline. `Gold` – amber-soft bg, amber text. `New` – cobalt-soft.
- Count badges (unread): red, 18px min height, tabular nums.

### Inputs
- Height 40, `bg-panel-sunk`, no border at rest, `--line` border + 3px cobalt-soft ring on focus.
- Search shows a `⌘K` / `Ctrl K` hint on the right.

### Empty, loading, error
- Loading: skeletons that match the final layout (identity block, 3 text lines, footer). No
  spinners in the feed.
- Empty: one sentence saying what's missing + one action. "No posts in Wholesale yet. Follow
  wholesalers in Directory to fill this feed."
- Error: what happened + how to fix. "Couldn't load the feed. Check your connection and retry."
  No apologies, no emoji.

---

## 8. Iconography & imagery

- Icon set: **lucide-react** only. 1.75 stroke, 20px in nav, 16px in buttons/metadata.
- No stock illustrations, 3D blobs, or decorative gradients.
- Product images: 4:3, `object-cover`, 8px radius, `--panel-sunk` placeholder.

---

## 9. Motion

- Durations: 120ms (hover/press), 200ms (open/close), 300ms max.
- Easing: `cubic-bezier(0.2, 0, 0, 1)`.
- Allowed: menus/modals opening, tab indicator sliding, like-count bump, toast in/out,
  new-posts pill sliding down from top of feed.
- Not allowed: scroll-reveal animations, card hover lifts, looping/ambient animation.
- Respect `prefers-reduced-motion`: disable all transforms, keep opacity fades only.

---

## 10. Accessibility floor (non-negotiable)

- Text contrast ≥ 4.5:1, large text/icons ≥ 3:1.
- Visible focus: `outline: 2px solid var(--cobalt); outline-offset: 2px` on every interactive
  element.
- All icon-only buttons have `aria-label`.
- Hit targets ≥ 40×40 on mobile.
- Never communicate state by color alone (verified badge has icon + text).

---

## 11. Voice & copy

- Plain, active, specific. "Send enquiry", "Follow supplier", "Post RFQ".
- Speak in trade language users already use: MOQ, RFQ, enquiry, quote, GST verified, bulk.
- Placeholders guide: "Share a product launch, stock update, or requirement…"
- No marketing slogans inside the app ("Connect. Discover. Grow." belongs on the landing page).

---

## 12. Rules for AI agents

1. Read this file before any UI task. Cite the section you followed in your summary.
2. Use tokens only (`bg-panel`, `text-ink`, `border-line`…). Hex codes in components = bug.
3. Reuse components from `components/ui/` before creating new ones. New shared component →
   add it to section 7.
4. Do not introduce new fonts, colors, radii, shadows, or spacing values. Propose changes to this
   file instead.
5. Check light mode, dark mode, 375px, 1024px, and 1440px before finishing.
6. Do not change business logic, API calls, or data shapes during visual work.
7. End every UI task with a short self-review: what's the one loud thing on the screen, and is
   anything decorative that can be removed?
