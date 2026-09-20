---
name: AgencySync Notepad
colors:
  surface: '#fcf9f8'
  surface-dim: '#FAFAF8'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#F5F4F1'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#434654'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#E3E1DB'
  outline-variant: '#c3c5d6'
  surface-tint: '#2154d1'
  primary: '#0044c1'
  on-primary: '#ffffff'
  primary-container: '#2f5edb'
  on-primary-container: '#e2e6ff'
  inverse-primary: '#b5c4ff'
  secondary: '#5e5e5c'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdc'
  on-secondary-container: '#636360'
  tertiary: '#893600'
  on-tertiary: '#ffffff'
  tertiary-container: '#b04700'
  on-tertiary-container: '#ffe1d5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164d'
  on-primary-fixed-variant: '#003cad'
  secondary-fixed: '#e4e2de'
  secondary-fixed-dim: '#c7c6c3'
  on-secondary-fixed: '#1b1c1a'
  on-secondary-fixed-variant: '#464744'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#FFFFFF'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  outline-strong: '#C9C7BF'
  ink-blue-container: '#EAEEFC'
  success: '#3E9C5B'
  warning: '#D98C2B'
  danger: '#C94F4F'
typography:
  headline-lg:
    fontFamily: Patrick Hand
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 32px
  headline-md:
    fontFamily: Patrick Hand
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 26px
  body-lg:
    fontFamily: Patrick Hand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Patrick Hand
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Patrick Hand
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  margin-desktop: 32px
  gutter: 1px
---

## Brand & Style

The design system is centered around the "Notepad Minimal" aesthetic—a digital translation of a physical, high-quality paper notebook. The core personality is human, focused, and unpretentious. It avoids the coldness of corporate software by prioritizing a handwritten feel and a "flat" physical presence.

The target audience consists of professionals who value clarity and a "single-sheet" focus over complex information density. The UI should evoke a sense of calm and tactile simplicity, utilizing heavy whitespace and delicate hairlines to define structure rather than shadows or blocks of color. 

Design pillars include:
- **Paper-First:** A pure white canvas that emphasizes content.
- **Human Touch:** Using handwritten typography to create a personal, approachable interface.
- **Pencil & Ink:** Visual hierarchy built on varied grey hairlines and a single blue ink accent.

## Colors

The palette is strictly limited to mimic stationery. 

- **The Page:** The background is always pure white (`#FFFFFF`). Subtle surface tiers (`#FAFAF8`, `#F5F4F1`) are used only for transient elements like bottom sheets or subtle header distinctions.
- **The Ink:** All primary text and critical information use a near-black ink (`#1A1A1A`). Secondary text and metadata use a softer "pencil" grey (`#6E6E6B`).
- **The Accent:** "Ink Blue" (`#2F5EDB`) is the single functional color. It is reserved for primary actions, active states, and interactive links.
- **Rules & Dividers:** 1px hairlines (`#E3E1DB`) serve as the structural backbone, replacing the need for shadows or cards.
- **Semantic Feedback:** Success, Warning, and Danger colors are muted and used functionally (e.g., priority indicators or error text) rather than decoratively.

## Typography

The design system exclusively uses **Patrick Hand** across all levels to maintain a singular, cohesive voice. 

- **Hierarchy:** Significance is established through scale rather than weight variations. Headlines should feel like underlined titles in a notebook—spacious and clear.
- **Legibility:** Despite the handwritten nature, body text must remain at 14px or 16px to ensure accessibility.
- **Styling:** Avoid all-caps and heavy letter-spacing, as these conflict with the natural flow of handwriting. Use the "Label-sm" tier sparingly for timestamps or technical IDs.
- **Mobile Considerations:** Headlines scale down minimally; the single-column focus allows the handwritten style to breathe without feeling cramped.

## Layout & Spacing

This design system follows a **mobile-first, single-column philosophy**. It mimics the vertical flow of a notepad.

- **Margins:** Generous side margins of 20px are mandatory to prevent content from feeling "pinned" to the glass edges.
- **The Rule:** Layout sections are separated by a 1px horizontal hairline (`#E3E1DB`). Avoid container boxes or nested grids; let the content dictate the vertical flow.
- **Rhythm:** Use a 4px base unit for internal component padding, but favor larger jumps (16px, 24px) between distinct content blocks to maintain a sense of "open paper."
- **Breakpoints:** On larger screens, the content should remain centered in a narrow container (max-width: 600px) rather than stretching, preserving the single-column notepad feel.

## Elevation & Depth

The system is fundamentally **flat**. Depth is a functional tool, not a stylistic preference.

- **Surface Layers:** Use "Surface-dim" or "Surface-container" tints for headers or footers to differentiate them from the main scrollable page without adding borders.
- **Lift:** Shadows are strictly prohibited for cards and buttons. The only exception is the "Minimal Lift" (0 2px 8px rgba(0,0,0,0.06)) applied to bottom sheets or modals to indicate they are temporary overlays sitting on top of the notepad.
- **Interaction:** Tap states should be indicated by a subtle color shift (e.g., moving to a slightly darker ink-blue or a faint grey fill) rather than an increase in shadow depth.

## Shapes

The shape language is "Soft-Rounded."

- **Containers:** Modals and containers use an 8px radius, suggesting the slightly softened corners of a paper pad.
- **Interactive Elements:** Buttons and tags use a **Pill-shaped (Full Radius)** approach. This creates a clear distinction between static content (square/soft corners) and actionable triggers (pill corners).
- **Subtle Details:** For smaller indicators like checkbox frames or priority ticks, use a 4px radius.

## Components

- **Buttons:**
  - *Primary:* Pill-shaped, Ink Blue background, White text. No shadows.
  - *Secondary:* Text-only in Ink Blue, optionally with a 1px underline.
- **Inputs:**
  - Fields are "underline-only" (1px rule) rather than boxed.
  - Labels float above in Pencil Grey (`#6E6E6B`) and use the `label-sm` typography.
- **Task Rows:**
  - No background fill or shadow. Separated by a 1px hairline.
  - Priority is indicated by a 3px vertical "ink stroke" on the far left of the row.
- **Chips & Tags:**
  - Pill-shaped with a 1px outline (`#E3E1DB`). 
  - Active states use the "Ink Blue Container" (`#EAEEFC`) fill with blue text.
- **Bottom Sheets:**
  - Feature an 8px top-corner radius and the only allowed soft shadow in the system.
- **Avatars:**
  - Simple circles with Initials in Ink Blue. No imagery or complex gradients.
- **Checkboxes:**
  - Soft 4px rounded squares with a 1px border. Checked state uses a simple blue "X" or checkmark that looks hand-drawn.