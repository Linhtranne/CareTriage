/**
 * Layout constants for Phase 1 agent-first surfaces.
 * No magic numbers in components. All dimensions referenced from here.
 */

export const LAYOUT = {
  /** Patient triage page */
  triage: {
    railWidth: 292,
    pageHeightOffset: 112,
    conversationMaxWidth: 820,
    pageMaxWidth: 1180,
    orbSizeDesktop: 48,
    orbSizeMobile: 36,
    headerMinHeight: 96,
    messageAvatarSize: 34,
    composerButtonWidth: 92,
    composerButtonInset: 16,
    composerMinHeight: 72,
    emptyStateMaxWidth: 9999,
    onboardingHeroMaxWidth: 9999,
    promptCardMinHeight: 190,
    intakeStationMinHeight: 720,
    progressPillMinWidth: 176,
  },

  /** Doctor review page */
  doctorReview: {
    queueWidth: 280,
    workbenchMaxWidth: 960,
  },

  /** Patient care plan page */
  carePlan: {
    maxWidth: 800,
    timelineWidth: 280,
  },

  /** Doctor workbench page */
  doctorWorkbench: {
    sidebarWidth: 320,
    boardMinWidth: 960,
  },

  /** Glass blur radii */
  glass: {
    blurDesktop: 16,
    blurMobile: 12,
    blurNav: 24,
  },

  /** App Shell layout constants */
  shell: {
    drawerWidth: 260,
    collapsedWidth: 84,
    islandMargin: 24,
    contentRightMargin: 6,
    contentTopPadding: 12,
    triageContentTopPadding: 12,
    logoMaxHeight: 32,
    logoMaxWidth: 140,
    navIconMinWidth: 40,
  },

  /** Breakpoints (reference values, Tailwind handles responsive) */
  breakpoint: {
    mobile: 600,
    tablet: 900,
    desktop: 1200,
  },
} as const
