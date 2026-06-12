# Frontend Agent-First Liquid Glass Shape Brief

## Status

**PENDING APPROVAL.** No code changes until every checklist item in the Approval section is confirmed.

**Phase:** 1 of N
**Register:** Product UI (clinical workflow, not marketing)
**Date:** 2026-05-27

---

## Scope

### Phase 1 (this brief)

Build two new page experiences:

| Page | Route | Replaces |
|---|---|---|
| Patient Triage | `/patient/triage` | Floating chat widget + `triage-tickets.jsx` |
| Doctor Review | `/doctor/review` | `triage-ticket-inbox.jsx` |

### Phase 2+ (future, not in scope)

- Patient: appointments, medical history, medical record detail, dashboard, book appointment
- Doctor: patient list, appointment management, EHR upload/search/result/summary, create medical record

Phase 2 work begins only after Phase 1 is visually approved and functionally tested.

---

## Non-Goals

- Do not rebuild all 15 doctor/patient pages in one pass.
- Do not delete legacy pages. They remain functional until Phase 1 replacements are approved.
- Do not build dark mode in Phase 1. Light theme (Meadow Mist ground) only.
- Do not build a public-facing mini chat entry widget. Future scope.
- Do not create new color values. All colors reference existing `DESIGN.md` tokens.

---

## Core Decision: Floating Chat Bubble

The floating chat bubble (`chat-widget.tsx`) is **removed from doctor and patient clinical workflows**.

| Surface | Before | After |
|---|---|---|
| Patient triage | Floating 400px widget, bottom-right | Full-page `agent-conversation-panel` at `/patient/triage`. The triage IS the page. |
| Doctor review | No direct chat; inbox shows ticket list | Structured review panels: `ai-summary-panel`, `missing-info-panel`, `ehr-entity-strip`, `clinical-timeline`, `agent-action-bar`. No chat bubble. |
| Public/non-auth | N/A | Optional future: a mini entry point that routes users to `/patient/triage`. Must not serve as the clinical workflow UI. |

Existing chat components (`chat-window.tsx`, `message-bubble.tsx`, `typing-indicator.tsx`) may be reused or refactored inside the full-page triage experience. `chat-widget.tsx` is deprecated for doctor/patient flows.

---

## Product Scenes

### Patient

**Who:** A 35-year-old office worker visiting a general hospital for the first time via CareTriage, using a phone in the waiting room at 9:00 AM under fluorescent lights and unreliable hospital wifi.

**Stress:** Moderate-to-high. Worried about chest pain lasting 2 days. Does not know which department to visit.

**10-second question:** "Is this dangerous? Do I need emergency care? If not, what is the next step?"

The UI must feel calm, guided, and trustworthy. Not a medical form. Not a chatbot gimmick. A clinical intake companion.

### Doctor

**Who:** An internal medicine doctor with 8 years of experience, using CareTriage daily. Sitting at a 24-inch monitor in the clinic at 14:00 with 15 triage cases queued and 3 patients currently being seen.

**Stress:** High throughput, moderate urgency. Needs to scan cases fast.

**10-second question:** "Which case needs attention now? Is the AI summary reliable? Are there red flags the AI missed?"

The UI must not slow the doctor down. Every click must have clinical justification.

---

## Agent-First Model

The AI agent operates differently for each role:

| Aspect | Patient-facing | Doctor-facing |
|---|---|---|
| Metaphor | Guided triage companion | Clinical decision-support layer |
| Presence | Chat participant (conversational) | Structured overlay on patient data |
| Interaction | Asks questions, interprets symptoms, suggests next steps | Summarizes, extracts entities, flags risks, proposes actions |
| Visual | Full conversation UI with triage-state indicators | Glass interpretation panels above solid patient records |

### Agent can do autonomously

- Collect and structure symptom information through guided conversation
- Extract clinical entities from free-text patient input
- Classify urgency: ROUTINE, SOON, URGENT, EMERGENCY
- Suggest department routing based on symptom analysis
- Detect red-flag symptom patterns and trigger emergency state
- Generate structured clinical summary from conversation
- Pre-fill appointment booking with triage data

### Requires human confirmation

- Emergency escalation lock (agent triggers, but patient can always call 115)
- Department assignment (agent suggests, doctor approves or overrides)
- Clinical note creation (agent drafts, doctor reviews and signs)
- Appointment booking (agent pre-fills, patient confirms)
- Triage ticket submission (agent prepares, patient explicitly sends)
- Override AI urgency (doctor action, documented reason required)
- Discharge/close ticket (doctor action only)

### Trust boundary

Glass = AI interpretation (provisional, translucent). Solid = raw patient data and human decisions (authoritative, opaque). This visual separation communicates what the AI thinks vs. what the patient said. Doctors can always see through glass to the raw data beneath.

---

## Phase 1 Patient Triage

### Flow

Entry > Guided triage conversation > Intake completeness check.

If emergency detected: emergency lock overlay with call-115 CTA. Chat input locked.

If not emergency: department suggestion > patient submits to doctor > appointment handoff (after doctor approves).

### Desktop layout (1200px and above)

Left: **Triage state rail** (240px, collapsible). Contains triage-state-orb, intake-progress-rail (vertical stepper: symptoms, history, details, review), and department-recommendation-panel when ready.

Right: **Agent conversation panel** (fills remaining width, max 720px centered). Contains message bubbles, AI suggestion surfaces (glass), quick replies, input bar with attachment support, and sticky submit CTA when triage is ready.

Bottom: **Trust footer** strip.

### Mobile layout (below 600px)

Top: compact AppBar. Below it: triage orb as a compact horizontal bar (orb + stage label + progress dots). Tapping expands a bottom sheet with full triage state.

Main area: full-screen conversation with messages, glass AI suggestions, scrollable quick replies.

Bottom sticky: input bar, then CTA bar above input when triage is ready.

### Key components and behavior

**Triage state orb** (48px desktop, 36px mobile): communicates AI processing state. Uses `primary-200` (collecting), `primary-400` (analyzing), `--color-success` (recommendation ready), `--urgency-emergency` (emergency). Not decorative.

**Intake progress rail**: vertical stepper (desktop) / horizontal dots (mobile). Steps: symptoms described, medical history provided, additional details, review and submit. States: incomplete (`--color-surface-200` hollow), in progress (`--color-primary-300` half-filled), complete (`--color-primary-500` filled), skipped (`--color-surface-200` dashed).

**Red flag detection**: when AI detects emergency symptoms, the triage orb transitions to `--urgency-emergency`, a solid red-flag-banner slides in (not glass), and if confirmed EMERGENCY, the emergency-lock-overlay takes over the full screen with a call-115 CTA.

**Department recommendation panel**: glass card below conversation when triage is complete. Shows department name, AI confidence (qualitative, not percentage), brief reasoning, action buttons.

**Trust footer**: persistent strip with safety copy. Not modal, not intrusive.

---

## Phase 1 Doctor Review

### Flow

Doctor opens review queue > selects a patient session > reviews AI summary, red flags, EHR entities, conversation transcript > takes action (approve, override, request info, assign department, convert to note).

### Desktop layout (1200px and above)

Left: **Patient session queue** (280px, collapsible). Each item shows urgency dot, patient name, chief complaint (truncated), time since submission, AI confidence badge. Sorted by urgency by default. Filter controls: All, Urgent, New, Pending.

Right: **Doctor review workbench** (fills remaining, max 960px content). Top section: AI summary panel (glass) alongside red flag panel (solid, if flags exist). Below: EHR entity strip (horizontal chips). Below: conversation transcript (collapsible, last 5 messages by default). Below: missing info panel (if any, warning treatment).

Bottom sticky: **Agent action bar** (solid, not glass).

| Action | Style | Confirmation |
|---|---|---|
| Approve Triage | Primary contained | Single click |
| Override Assessment | Outline, opens inline form | Yes, reason required |
| Request More Info | Outline, sends notification to patient | Single click |
| Assign Department | Dropdown then confirm | Yes |
| Convert to Clinical Note | Outline, opens note editor | Yes, review before save |

### Tablet layout (600px to 1199px)

Queue collapses into a horizontal scroll strip at the top. Selecting a patient pushes workbench to full width below, single column.

### Mobile fallback (below 600px)

Not optimized for phone. Shows vertically scrollable queue sorted by urgency. Tapping a patient shows summary + red flags + action buttons. Full transcript and EHR entities behind expandable sections. Callout: "Use a computer for the full experience."

### Doctor AI panels

**AI summary panel (glass surface)**: the signature glass component. Shows chief complaint, duration, severity, AI urgency classification with reasoning, suggested department, confidence indicator, expandable "View AI details" section. The glass treatment communicates: this is AI interpretation, not final truth.

**Red flag panel**: solid, never glass. Uses `--color-accent-500` text on light accent background. Appears ABOVE the AI summary when flags exist. Each flag shows icon, description, and source from the conversation.

**EHR entity strip**: horizontal chips. Categories: Symptom, Duration, Medication, Allergy, Vital, Condition. Uses `--color-primary-50` background with `--color-primary-700` text. Flagged entities use `--color-accent-400` treatment.

**Clinical timeline**: expandable section with the full patient-AI conversation in compact scannable format. Preserves original bubble styling in a denser layout.

**Missing info panel**: solid warning treatment. Lists information gaps the AI identified.

---

## Liquid Glass Rules

Glass is not decoration. It represents the AI interpretation layer.

### When to use glass

- AI summary panels
- Triage state indicator backgrounds
- Agent suggestion overlays
- Department recommendation panels (AI-generated)

### When NOT to use glass

- Raw patient data areas
- Human action surfaces (buttons, action bars, forms)
- Emergency states (must be solid, high-contrast)
- Dense text areas (blur must not appear behind body text)
- Any surface where glass would reduce readability below WCAG AA

### Surface hierarchy

| Level | Name | Treatment | Examples |
|---|---|---|---|
| L0 | Ground | Solid `--color-surface-50` | Page background, patient data |
| L1 | Surface | Solid `neutral.paper` | Cards, panels, inputs, action bars |
| L2 | Glass | Translucent + backdrop blur | AI summary, triage orb background, suggestions |
| L3 | Elevated | Solid + elevated shadow | Modals, dropdowns, emergency overlays |

### Glass limits

- Desktop: maximum 3 glass layers per viewport.
- Mobile: maximum 2 glass layers per viewport.
- Blur must not be applied behind dense text blocks.
- If contrast between text and glass background is below WCAG AA (4.5:1 body, 3:1 large), fall back to solid surface.
- `@supports (backdrop-filter: blur(1px))` feature detection required. Fallback: solid `neutral.paper` with `--color-surface-200` border.

### Emergency treatment

Emergency breaks glass. When emergency is detected:

1. All glass surfaces transition to solid within 200ms.
2. Emergency overlay uses solid `--color-accent-500` background. Not glass.
3. All blur effects are removed.
4. High-contrast palette: `--urgency-emergency` on the approved emergency contrast surface token, and the approved emergency inverse text token on `--urgency-emergency`.
5. Animations reduced to essential only (pulse on call button).
6. `prefers-reduced-motion` users see static emergency state.

### States

| State | Glass treatment |
|---|---|
| Loading | Glass visible, content shows shimmer (`--color-surface-100` to `--color-surface-200` pulse). No spinner. |
| Skeleton | Solid `--color-surface-100` rectangles, opacity pulse 0.4 to 0.7. |
| Disabled | Glass loses blur, becomes solid `--color-surface-50`. 40% opacity. |
| Offline | Glass shows subtle grain overlay. Connection banner is solid. |
| Error | Glass border transitions to `--urgency-emergency`. Error message on solid background below panel. |

---

## Token Strategy

No raw OKLCH or hex values in components. All colors reference existing `DESIGN.md` tokens via CSS custom properties or TypeScript constants.

### Existing tokens used as-is

| Role | Token |
|---|---|
| Page background | `--color-surface-50` |
| Card/panel surface | `neutral.paper` from `design-tokens.ts` |
| Primary accent | `--color-primary-500` |
| Primary hover | `--color-primary-600` |
| Emergency / destructive | `--color-accent-500` |
| Emergency light | `--color-accent-400` |
| Warning | `--color-warning` |
| Success | `--color-success` |
| Info | `--color-info` |
| Text primary | `--color-surface-800` |
| Text secondary | `--color-surface-700` |
| Borders | `--color-surface-200` |
| Focus ring | `--color-primary-500` |

### New semantic aliases to introduce

Each alias is derived from existing `DESIGN.md` tokens. No new color values.

| New Token | Derived From | Purpose |
|---|---|---|
| `--glass-surface` | `neutral.paper` at 72% opacity | Glass panel background |
| `--glass-border` | `--color-surface-200` at 50% opacity | Glass panel border |
| `--glass-highlight` | `--color-primary-400` at 40% opacity | Active/focused glass border |
| `--agent-surface` | Alias of `--glass-surface` | AI-generated content background |
| `--urgency-emergency` | `--color-accent-500` | Emergency urgency indicator |
| `--urgency-warning` | `--color-warning` | Warning/urgent urgency indicator |
| `--urgency-routine` | `--color-primary-300` | Routine urgency indicator |

### Blur values (not colors, defined as layout constants)

| Token | Value | Scope |
|---|---|---|
| `--glass-blur-desktop` | `16px` | Default glass blur on desktop |
| `--glass-blur-mobile` | `12px` | Reduced blur on mobile for performance |
| `--glass-blur-nav` | `24px` | Sidebar/AppBar blur (existing DESIGN.md pattern) |

### Single source of truth

- CSS custom properties: `styles/global.css` (Tailwind reads these)
- TypeScript constants: `constants/design-tokens.ts` (MUI theme reads these)
- No color values anywhere else. ESLint `no-hardcoded-colors` rule enforced.

---

## Component Inventory

### Phase 1: Patient Triage

| File (kebab-case) | Export (PascalCase) | Glass? | Purpose |
|---|---|---|---|
| `agent-conversation-panel.tsx` | `AgentConversationPanel` | Partial (AI messages) | Full-page triage conversation container |
| `message-bubble.tsx` | `MessageBubble` | No | Refactored from existing, updated styling |
| `typing-indicator.tsx` | `TypingIndicator` | No | Kept from existing, minor update |
| `triage-state-orb.tsx` | `TriageStateOrb` | Yes (background) | Circular AI processing state indicator |
| `intake-progress-rail.tsx` | `IntakeProgressRail` | No | Vertical/horizontal stepper for completeness |
| `red-flag-banner.tsx` | `RedFlagBanner` | No (solid) | Emergency warning banner |
| `department-recommendation-panel.tsx` | `DepartmentRecommendationPanel` | Yes | AI department suggestion after triage |
| `emergency-lock-overlay.tsx` | `EmergencyLockOverlay` | No (solid) | Full-screen emergency, replaces existing |
| `trust-footer.tsx` | `TrustFooter` | No | Safety disclaimer strip |

### Phase 1: Doctor Review

| File (kebab-case) | Export (PascalCase) | Glass? | Purpose |
|---|---|---|---|
| `doctor-review-workbench.tsx` | `DoctorReviewWorkbench` | No (container) | Main review layout |
| `patient-session-queue.tsx` | `PatientSessionQueue` | No | Sortable/filterable patient queue |
| `ai-summary-panel.tsx` | `AiSummaryPanel` | Yes (signature) | Glass panel with AI triage summary |
| `urgency-badge.tsx` | `UrgencyBadge` | No | Urgency level chip |
| `confidence-indicator.tsx` | `ConfidenceIndicator` | No | Qualitative AI confidence display |
| `missing-info-panel.tsx` | `MissingInfoPanel` | No (solid warning) | Gaps in patient data |
| `ehr-entity-strip.tsx` | `EhrEntityStrip` | No | Horizontal strip of extracted entities |
| `clinical-timeline.tsx` | `ClinicalTimeline` | No | Expandable conversation transcript |
| `agent-action-bar.tsx` | `AgentActionBar` | No (solid) | Sticky bottom action bar |

### Phase 1: Shared

| File (kebab-case) | Export (PascalCase) | Glass? | Purpose |
|---|---|---|---|
| `glass-surface.tsx` | `GlassSurface` | Yes | Reusable glass container primitive |

### Existing components: Phase 1 actions

| Current file | Action |
|---|---|
| `chat-window.tsx` | Refactor into `agent-conversation-panel` |
| `message-bubble.tsx` | Refactor (update styling, keep logic) |
| `typing-indicator.tsx` | Keep with minor styling update |
| `emergency-overlay.tsx` | Replace with `emergency-lock-overlay` |
| `triage-conclusion-card.tsx` | Replace with `department-recommendation-panel` |
| `chat-widget.tsx` | Deprecated for clinical flows. Do not delete yet. |
| `chat-history-list.tsx` | Integrate into `agent-conversation-panel` |

### Future components (Phase 2+)

- `handoff-summary` (post-approval summary card)
- `patient-queue-item` (if queue needs a standalone item component)
- Additional EHR-specific components for upload/search pages

---

## Architecture Proposal

### Phase 1 folder structure

```
src/
  features/
    triage/
      components/          # Patient triage components listed above
      hooks/
        use-triage-session.ts
        use-triage-state.ts
        use-emergency-detection.ts
      constants/
        triage-copy.ts     # All text, i18n-ready
      types/
        triage.types.ts

    doctor-review/
      components/          # Doctor review components listed above
      hooks/
        use-patient-queue.ts
        use-doctor-actions.ts
      constants/
        doctor-copy.ts
      types/
        doctor-review.types.ts

    ehr/
      components/
        ehr-entity-strip.tsx
      types/
        ehr.types.ts

    agent-session/
      components/
        confidence-indicator.tsx
        urgency-badge.tsx
        typing-indicator.tsx
      hooks/
        use-websocket.ts
        use-agent-status.ts
      constants/
        agent-copy.ts
      types/
        agent.types.ts

  components/
    base/
      glass-surface.tsx
      emergency-lock-overlay.tsx
      red-flag-banner.tsx
      trust-footer.tsx
    features/
      notification-bell.tsx  # Existing, keep

  pages/
    patient/
      triage-page.tsx        # NEW Phase 1
      [legacy pages remain]
    doctor/
      review-page.tsx        # NEW Phase 1
      [legacy pages remain]

  constants/
    design-tokens.ts         # Extended with glass + urgency aliases
    layout-constants.ts      # NEW: named layout values (rail width, max-widths, etc.)

  styles/
    global.css               # Extended with glass CSS custom properties
    theme.ts                 # Extended with glass MUI palette entries

  layouts/
    main-layout.tsx          # Existing, refactored if needed
    patient-layout.tsx       # NEW: patient-specific layout for triage
    doctor-layout.tsx        # NEW: doctor-specific layout for review
    public-layout.tsx        # Existing, keep
```

### Code conventions enforced

- File names: `kebab-case.tsx`
- React exports: `PascalCase`
- No hardcoded text in components. All copy through `constants/*-copy.ts`, structured for i18n.
- No hardcoded colors. All via design tokens or Tailwind classes referencing CSS variables.
- No magic numbers. Layout dimensions defined in `layout-constants.ts`.
- No `any` type. TypeScript strict mode.
- Tailwind for utility classes. MUI for complex components (buttons, inputs, dialogs). Both read from the same CSS custom properties. No drift.

---

## Legacy Migration Strategy

### Phase 1 approach

1. **Do not delete legacy pages.** They remain functional and routed.
2. Create new page files (`triage-page.tsx`, `review-page.tsx`) alongside existing ones.
3. If the project has a feature flag system, gate new routes behind a flag (e.g., `FEATURE_AGENT_UI`).
4. If no feature flag system exists, add new route entries in `routes/index.tsx` and switch routing only after visual and functional review.
5. `chat-widget.tsx` is deprecated for clinical flows but not deleted until Phase 2.

### Legacy files affected by Phase 1

| File | Status |
|---|---|
| `pages/patient/triage-tickets.jsx` | Kept. New `triage-page.tsx` replaces its function. |
| `pages/doctor/triage-ticket-inbox.jsx` | Kept. New `review-page.tsx` replaces its function. |
| `components/chat/chat-widget.tsx` | Deprecated. Not used in new flows. |
| `components/chat/chat-window.tsx` | Logic refactored into `agent-conversation-panel`. Original file kept until migration verified. |
| `components/chat/emergency-overlay.tsx` | Replaced by `emergency-lock-overlay`. Original kept until migration verified. |
| `components/chat/triage-conclusion-card.tsx` | Replaced by `department-recommendation-panel`. Original kept. |
| `components/doctor/doctor-page-shell.jsx` | Kept. New `doctor-layout.tsx` used for review page only. |
| `components/patient/patient-page-shell.jsx` | Kept. New `patient-layout.tsx` used for triage page only. |

### All `.jsx` files in Phase 1 scope are written as `.tsx` (TypeScript).

---

## Accessibility And Safety

### Accessibility

- All text on glass surfaces must pass WCAG AA (4.5:1 body, 3:1 large text). If contrast fails, fall back to solid surface.
- `prefers-reduced-motion: reduce` disables glass transitions and non-essential animations. Glass renders instantly as static.
- Forced-colors mode: glass becomes solid with visible borders.
- All interactive elements have visible focus indicators (2px `--color-primary-500` ring, 2px offset).
- AI-generated content labeled with `aria-description` for screen readers.
- Emergency overlay works without animation.

### Emergency safety

- Emergency overlay uses solid rendering. No glass, no blur, no dependency on `backdrop-filter`.
- Overlay cannot be dismissed by the patient. Only action: call 115.
- Chat input locked during emergency.
- Emergency state persists across page refresh (session storage).
- Legal disclaimer footer always visible on triage page.

---

## Implementation Risks

### Glass readability

Glass surfaces reduce text contrast. Mitigation: WCAG AA enforcement, glass only on `--color-surface-50` ground (controlled background, never images), fallback to solid when `backdrop-filter` unsupported, maximum 2-3 glass layers per viewport.

### Mobile performance

`backdrop-filter: blur()` is GPU-intensive. Mitigation: 12px blur on mobile (vs 16px desktop), max 2 glass surfaces on mobile viewport, `will-change` used sparingly, progressive enhancement (remove glass on low-end devices if needed).

### Over-trusting AI output

Glass could make AI summaries look authoritative. Mitigation: glass itself communicates provisionality, confidence indicator always visible, "AI-generated" label on every panel, override actions equally prominent as approve, red flags are always solid.

### Emergency UX liability

If emergency overlay fails, patient safety is at risk. Mitigation: solid rendering (no glass dependency), cannot be dismissed, input locked, state persists across refresh.

### Token drift (Tailwind vs MUI)

Two styling systems can diverge. Mitigation: single source of truth (`design-tokens.ts` + `global.css`), ESLint `no-hardcoded-colors` rule, `layout-constants.ts` for dimensions, glass tokens added to both sources simultaneously.

### Phase 1 scope creep

Risk of expanding into Phase 2 pages during implementation. Mitigation: this brief explicitly limits Phase 1 to two pages. All other pages are out of scope.

---

## Approval Checklist

> **No code changes until every item below is approved.**

- [ ] Approve Phase 1 scope: patient triage + doctor review only
- [ ] Approve removal of floating chat bubble from doctor/patient clinical flows
- [ ] Approve full-page patient conversation model (triage IS the page)
- [ ] Approve doctor review cockpit model (queue + workbench, no chat bubble)
- [ ] Approve liquid glass intensity rules (AI surfaces only, max 2 mobile / 3 desktop)
- [ ] Approve token alias strategy (semantic aliases derived from existing DESIGN.md tokens, no new colors)
- [ ] Approve legacy migration strategy (keep old pages, add new alongside, switch after review)
