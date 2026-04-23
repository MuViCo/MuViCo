# Design System

## Document metadata

- Version: 1.5.0
- Last updated: 23.04.2026
- Owner: MuViCo

## Purpose

This document is intended to be used as a practical guideline for building and maintaining a consistent UI across MuViCo.
It defines the currently used visual decisions (colors, typography, spacing, and component behavior) so that new features follow the same style and interaction patterns.

## Change policy

- If colors, typography, spacing tokens, or component states are changed in implementation, this document must be updated in the same PR.
- UI-related PRs should include a short note describing which design tokens or patterns were changed.
- If a new reusable component or pattern is introduced, add it to this document before merging.

## Style guides

Implementation baseline
- UI framework: Chakra UI + project level CSS in styles.css
- Theme source: src/client/lib/theme.jsx
- Main editor button styles: styles.css

### Colors

- Primary: #BD5BFF (main action buttons)
- Primary Dark: #8941B9 (hover), #553C9A (active)
- Secondary: #312238 (editor panel background)
- Background: #FFFFFF (light), #120D14 (dark edit mode background)
- Surface: #EEDEF7 (light panel), #312238 (dark panel)
- Error: #E53E3E (base), #C53030 (hover), #9B2C2C (active)
- Text Primary: #FFFFFF on colored buttons, #000000 on light panels
- Text Secondary: #ACACAC (input placeholder / secondary helper tone)

Supporting tokens currently in use
- Outline border: #572B6E
- Focus ring: rgba(128, 90, 213, 0.45)
- Accent purple border: #B55FE0, #B31BFF

### Typography

- Font Family: Poppins (heading + body), sans-serif fallback
- Heading 1: Chakra 3xl usage in modal headers (e.g. Help page)
- Heading 2: 2xl bold for manual accordion section titles
- Lead text: lg / semibold usage in tutorial and key guidance text
- Body text: Chakra default md/sm with Poppins

Notes
- Additional decorative fonts exist in front page only: Boldonse, Zalando Sans Expanded.
- Section-title variant in theme sets underline and fontSize 20.

### Spacing

- Base unit: 4px (0.25rem) with common usage at 8px and 16px
- Values in use:
	- 0.5rem (8px)
	- 0.75rem (12px)
	- 1rem (16px)
	- 2rem (32px)
	- 2.75rem (44px control height for playback buttons)

Layout spacing examples
- Editor workspace gap: 1rem
- Main edit mode page gap: 2rem
- Button paddings: 0.5rem 0.75rem

### Components

- Button border radius: 0.375rem (6px) for custom editor buttons
- Card border radius: md/lg in Chakra; 8px and 10px are common concrete values in editor panels/grid
- Card shadow: Chakra sm/md/lg + custom shadows (e.g. 0 2px 4px rgba(0,0,0,0.2))
- Input border: Chakra default outline; custom color input outline 1px solid #8282824a
- Form field radius: Chakra default md, with custom 4px/5px in color and cue editing elements

Button state system in editor
- Default: #BD5BFF
- Hover: #8941B9
- Active: #553C9A
- Focus: rgba(128, 90, 213, 0.45) ring
- Danger action (stop/close): #E53E3E -> #C53030 -> #9B2C2C

## Pattern library

- A pattern library describes repeatable UI solutions made from multiple components.

Current UI patterns to document
- Editing workflow pattern
	- Edit title -> add elements -> edit/copy/delete -> preview/playback.
- Playback control pattern
	- Previous/Next navigation + open screens + autoplay + sec/frame control.
- Modal help pattern
	- User manual via accordion sections with concise actionable bullet lists.
- Guided tutorial pattern
	- Highlight target element + step tooltip + keyboard navigation support.
- Form pattern
	- Label/helper/error stack with media upload and optional color picker branch.


## Component library

- A component library lists reusable UI building blocks used in the codebase.

Core reusable components in current implementation
- PresentationManual (manual modal content and section grouping)
- FeatureSection and NestedList (documentation list rendering)
- PresentationPlaybackControls
- ShowModeButtons
- EditModeHeaders (row/column controls for screens and frames)
- CuesForm (element creation and editing form)
- GridLayoutComponent (cue rendering and inline actions)
- TutorialGuide (step-by-step contextual onboarding)
