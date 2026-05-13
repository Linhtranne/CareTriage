---
name: CareTriage
description: Smart hospital management with AI-powered triage and EHR extraction.
colors:
  living-teal: "#08bba3"
  living-teal-light: "#20d6bc"
  living-teal-deep: "#039786"
  warm-coral: "#f43f5e"
  warm-coral-light: "#fb7185"
  warm-coral-deep: "#e11d48"
  emerald-ink: "#064e3b"
  emerald-active: "#059669"
  meadow-mist: "#f0fdf4"
  cloud-white: "#f8fafc"
  frost-gray: "#f1f5f9"
  silver-edge: "#e2e8f0"
  slate-muted: "#64748b"
  slate-body: "#1e293b"
  slate-deep: "#0f172a"
  signal-success: "#10b981"
  signal-warning: "#f59e0b"
  signal-danger: "#ef4444"
  signal-info: "#3b82f6"
typography:
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  page: "24px"
components:
  button-primary:
    backgroundColor: "{colors.living-teal}"
    textColor: "{colors.cloud-white}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.living-teal-deep}"
  button-cta:
    backgroundColor: "{colors.signal-success}"
    textColor: "{colors.cloud-white}"
    rounded: "{rounded.lg}"
    padding: "16px 48px"
  button-cta-hover:
    backgroundColor: "{colors.emerald-active}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.living-teal}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  card-default:
    backgroundColor: "{colors.cloud-white}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-default:
    backgroundColor: "{colors.cloud-white}"
    textColor: "{colors.slate-body}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  nav-item-active:
    backgroundColor: "rgba(16, 185, 129, 0.12)"
    textColor: "{colors.emerald-active}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  chip-role:
    backgroundColor: "rgba(16, 185, 129, 0.12)"
    textColor: "{colors.emerald-active}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: CareTriage

## 1. Overview

**Creative North Star: "The Intelligent Corridor"**

CareTriage's visual system is a corridor that guides: every element has a direction, every surface leads somewhere, every interaction confirms progress. The aesthetic is bright, layered, and alive. Surfaces breathe with gentle depth; transitions move with the assurance of a clinician who knows the next step. The system trusts the user enough to stay minimal, but never so sparse that context is lost.

This is not a sterile hospital terminal. It is not a consumer wellness app padded with pastel illustrations and empty reassurance. It rejects the "white-and-teal" flatness of legacy medical software (PRODUCT.md: "App y tế trắng xanh điển hình") and the cluttered data-dump of old hospital management systems (PRODUCT.md: "Phần mềm bệnh viện cũ kỹ"). The Intelligent Corridor is bright but purposeful, modern but never decorative for its own sake.

The primary color, Living Teal, carries energy and trust simultaneously. It appears sparingly on neutral product screens (Restrained strategy) but fills CTAs and active states with confident saturation. Warm Coral exists only as an urgent counterpoint: errors, critical alerts, destructive actions. Every screen answers three questions instantly: where am I, what can I do next, and did my action succeed.

**Key Characteristics:**
- Bright, layered surfaces with gentle ambient depth
- Living Teal as a confident, energetic primary; never clinical or cold
- Soft, approachable interactions with generous radii and smooth transitions
- Every interaction produces visible feedback (loading, success, error)
- Semantic HTML structure; components built for reuse, not repetition

## 2. Colors: The Living Teal Palette

A palette built on teal energy grounded by warm slate neutrals. Color usage follows the Restrained strategy on product screens (tinted neutrals + Living Teal accent on interactive elements) while CTAs and hero sections push toward Committed territory with fuller saturation.

### Primary
- **Living Teal** (#08bba3): The primary accent. Buttons, links, active states, focus rings. Energetic but trustworthy; never cold or clinical. Used on interactive elements only; background usage is reserved for CTAs and hero gradients.
- **Living Teal Light** (#20d6bc): Gradient endpoints, hover shimmer, subtle highlights. Paired with Living Teal for directional gradients on primary contained buttons.
- **Living Teal Deep** (#039786): Hover and pressed states. The "click confirmed" shade.

### Secondary
- **Warm Coral** (#f43f5e): Urgent actions, destructive buttons, error states, logout. Its warmth prevents it from feeling purely negative; it signals importance, not just danger.
- **Warm Coral Light** (#fb7185): Soft error backgrounds, warning badges.
- **Warm Coral Deep** (#e11d48): Pressed state on destructive actions.

### Neutral
- **Meadow Mist** (#f0fdf4): Primary page background. A green-tinted off-white that prevents the sterile feel of pure white. The tint is subtle enough to read as "bright" while carrying the brand hue.
- **Cloud White** (#f8fafc): Card and paper surfaces. Sits one step above Meadow Mist for layered depth.
- **Frost Gray** (#f1f5f9): Secondary surface, input backgrounds, divider zones.
- **Silver Edge** (#e2e8f0): Borders, dividers, scrollbar thumbs, card strokes. The structural line color.
- **Slate Muted** (#64748b): Secondary text, captions, metadata, timestamps.
- **Slate Body** (#1e293b): Primary text. Deep enough for WCAG AA on all neutral backgrounds.
- **Slate Deep** (#0f172a): High-emphasis headings, modal titles.

### Semantic
- **Signal Success** (#10b981): Confirmation toasts, completed states, online indicators.
- **Signal Warning** (#f59e0b): Pending states, approaching deadlines, soft alerts.
- **Signal Danger** (#ef4444): Validation errors, failed operations, system alerts.
- **Signal Info** (#3b82f6): Informational badges, help tooltips, neutral callouts.

### Named Rules
**The Meadow Ground Rule.** Every page background is Meadow Mist (#f0fdf4), never pure white (#fff) or pure black (#000). Neutrals carry a faint green tint (chroma 0.005-0.01 in OKLCH) so the entire interface feels connected to the brand. Cards and papers float on Cloud White above this ground.

**The Coral Scarcity Rule.** Warm Coral appears only for destructive actions, errors, and urgent states. It is never used decoratively, never in gradients, never as an accent on non-critical elements. Its rarity is what makes it urgent.

## 3. Typography

**Body Font:** Inter (with -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif fallback)

**Character:** A single-family system built on Inter's clarity and variable-weight range. The hierarchy relies on weight contrast (400 to 900) and deliberate size jumps (≥1.25 ratio between steps) rather than typeface variety. Inter's tight apertures and tall x-height read cleanly on medical data at small sizes; its heavier weights carry authority on hero headings.

### Hierarchy
- **Display** (900, clamp(2.25rem, 5vw, 4rem), 1.15): Landing page hero headlines only. Letter-spacing -0.02em for density at scale. Color: Emerald Ink (#064e3b).
- **Headline** (700, 1.875rem, 1.3): Section headers, page titles within the app shell. The primary "where am I" signal.
- **Title** (600, 1.25rem, 1.4): Card headers, dialog titles, subsection labels. The workhorse heading level.
- **Body** (400, 1rem, 1.6): All running text. Max line length: 65-75ch. Color: Slate Body (#1e293b).
- **Label** (600, 0.875rem, 1.5): Form labels, chip text, sidebar navigation, table headers, metadata. The "small but important" tier.

### Named Rules
**The Weight Ladder Rule.** Heading hierarchy is expressed through weight first, size second. Display (900) to Headline (700) to Title (600) to Body (400). Never use the same weight at two adjacent hierarchy levels. If two headings look the same weight, one of them is wrong.

## 4. Elevation

The system uses layered ambient depth. Surfaces carry gentle shadows at rest to establish spatial hierarchy. Shadows intensify on interaction (hover, focus, drag) to confirm engagement. This is not flat-by-default; it is gently-present-always, amplified-on-action.

### Shadow Vocabulary
- **Ambient Rest** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`): Cards, papers, containers at rest. The baseline depth that separates content from background.
- **Ambient Hover** (`0 4px 12px rgba(8, 187, 163, 0.3)`): Primary button hover. Teal-tinted glow that connects the shadow to the brand color.
- **Elevated** (`0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)`): Modals, dropdown menus, elevated panels. Reserved for content that floats above the page flow.
- **Deep Float** (`0 30px 60px rgba(0,0,0,0.05)`): Feature showcase panels, sticky media frames. Ultra-subtle on large surfaces.
- **Sidebar Presence** (`4px 0 24px rgba(0, 0, 0, 0.06)`): The fixed sidebar. Directional shadow that anchors it to the left edge.
- **AppBar Whisper** (`0 2px 12px rgba(0,0,0,0.04)`): The sticky top bar. Barely visible; enough to separate it from scrolling content.

### Named Rules
**The Tinted Glow Rule.** Interactive element hover shadows use the element's own color tinted at low opacity (e.g. `rgba(8, 187, 163, 0.3)` for teal buttons), not neutral black shadows. The shadow feels like a reflection of the element, not a generic depth cue.

## 5. Components

### Buttons
Soft and approachable; generous radius with smooth transitions.

- **Shape:** Gently curved edges (10px radius for standard, 16px for CTAs, full-round for icon buttons)
- **Primary Contained:** Living Teal to Living Teal Light gradient (`linear-gradient(135deg, #08bba3 0%, #20d6bc 100%)`), white text, no resting shadow. Hover lifts with teal-tinted glow (`0 4px 12px rgba(8, 187, 163, 0.3)`).
- **CTA (Hero):** Emerald gradient (`linear-gradient(135deg, #10b981 0%, #059669 100%)`), larger padding (16px 48px), stronger shadow (`0 10px 25px rgba(16, 185, 129, 0.3)`). Hover: translateY(-3px) + scale(1.02) + deeper shadow.
- **Outlined:** Transparent background, Living Teal border and text. Hover fills with faint teal wash (`rgba(16, 185, 129, 0.05)`).
- **Destructive:** Warm Coral gradient. Reserved for logout, delete, cancel.
- **Focus:** 2px solid Living Teal outline, 2px offset. Consistent across all variants.

### Cards / Containers
- **Corner Style:** Generously rounded (16px radius). Never sharp.
- **Background:** Cloud White (#f8fafc) floating on Meadow Mist ground.
- **Shadow Strategy:** Ambient Rest at rest; Elevated on hover where appropriate.
- **Border:** 1px solid Silver Edge (#e2e8f0). Subtle structural line.
- **Internal Padding:** 24px standard; 16px compact.

### Inputs / Fields
- **Style:** Outlined variant, Cloud White background, 10px radius, Silver Edge border.
- **Focus:** Border transitions to Living Teal. Subtle teal glow.
- **Error:** Border transitions to Signal Danger. Error text below in Warm Coral.
- **Disabled:** Frost Gray background, reduced opacity text.

### Navigation
The sidebar is the primary navigation structure. Glassmorphic surface (`rgba(255, 255, 255, 0.72)` with 24px backdrop blur) anchored to the left edge. Collapsible between 260px (expanded) and 68px (collapsed) with cubic-bezier(0.4, 0, 0.2, 1) transition.

- **Nav Item Default:** Label weight 500, Slate Muted text, transparent background. 10px radius.
- **Nav Item Active:** Background `rgba(16, 185, 129, 0.12)`, text and icon Emerald Active (#059669), weight 700.
- **Nav Item Hover:** Background `rgba(16, 185, 129, 0.06)`.
- **Top Bar:** Glassmorphic (`rgba(255, 255, 255, 0.75)` + 20px blur), sticky, minimal shadow. Contains breadcrumb text, language toggle, notifications, and avatar menu.

### Chat Bubbles (Signature Component)
The AI triage chat is the product's signature interaction. Bubbles use directional radius to indicate sender:
- **Patient (outgoing):** Emerald Active (#059669) background, white text. Radius: `16px 16px 4px 16px` (flat bottom-right corner points toward sender).
- **AI (incoming):** Soft teal wash (`rgba(16, 185, 129, 0.1)`) background, 1px teal border, Emerald Ink text. Radius: `16px 16px 16px 4px` (flat bottom-left).
- **Transitions:** Fade-in with 500ms duration on new messages.

## 6. Do's and Don'ts

### Do:
- **Do** use Meadow Mist (#f0fdf4) as the universal page background. Cards float on Cloud White above it.
- **Do** provide visible feedback for every user interaction: loading spinners, success toasts, error messages. (PRODUCT.md: "Phản hồi mọi thao tác")
- **Do** use semantic HTML elements (nav, main, section, article, aside) before reaching for div. (PRODUCT.md: "Semantic trước tiên")
- **Do** tint hover shadows with the element's own brand color instead of neutral black.
- **Do** use Inter at weight 600+ for labels and navigation; weight 400 for body text. The weight ladder is the hierarchy.
- **Do** test all color combinations against WCAG AA contrast ratios. Slate Body (#1e293b) on Cloud White (#f8fafc) passes; verify all other pairings.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for entrance animations and `cubic-bezier(0.4, 0, 0.2, 1)` for layout transitions.
- **Do** lazy-load images, use WebP/SVG formats, and minify CSS/JS bundles. (PRODUCT.md: "Hiệu suất là tính năng")

### Don't:
- **Don't** use pure white (#fff) or pure black (#000) anywhere. All neutrals carry a faint green tint toward the brand hue.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, alerts, or list items. Use background tints or icons instead.
- **Don't** use gradient text (`background-clip: text`). Emphasis through weight or color, never decorative gradients on type.
- **Don't** use glassmorphism decoratively. It is reserved for the sidebar and top bar navigation surfaces only.
- **Don't** build interfaces that look like "phần mềm bệnh viện cũ kỹ": cluttered tables, gray monotone surfaces, overlapping panels without clear hierarchy. (PRODUCT.md anti-reference)
- **Don't** create "app y tế trắng xanh điển hình": safe but bland designs with no personality, no motion, no brand expression. (PRODUCT.md anti-reference)
- **Don't** leave any click, submit, or navigation action without visual feedback. No silent failures, no mystery loading states. (PRODUCT.md: "UI không phản hồi")
- **Don't** nest cards inside cards. If you need grouped content within a card, use spacing and dividers.
- **Don't** use bounce or elastic easing curves. Ease out with exponential curves only (quart/quint/expo).
- **Don't** abuse div elements. If an element has semantic meaning, use the appropriate HTML5 tag. (PRODUCT.md: "Giao diện lạm dụng div")
