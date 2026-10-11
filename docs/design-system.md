# Design System Specification — Light Blue Identity

**Project:** Student Career Platform  
**Visual Theme:** Modern Light Blue & Cyan Accent  
**Document Version:** 1.0.0  

---

## 1. Visual Identity & Brand Philosophy

The visual design system of the Student Career Platform is designed to feel:
- **Modern & Premium:** Polished SaaS quality that builds immediate trust and credibility.
- **Student-Friendly & Youthful:** Vibrant, motivating, inviting, and uncluttered.
- **Professional:** Suitable for presenting candidates to enterprise recruiters and tech companies.
- **Clean & High-Contrast:** Strict adherence to WCAG 2.1 AA accessibility standards with crisp typography and generous breathing room.

**Aesthetic Constraints:**
- **NO** dark-heavy or gothic aesthetics.
- **NO** gaming/cyberpunk themes or excessive neon glows.
- **NO** overly corporate, rigid "banking-style" grey grids.
- **NO** childish illustrations or distracting micro-animations.

---

## 2. Color Palette & Design Tokens

### 2.1. Primary Color Tokens

| Token Name | Hex Code | HSL / RGB | Intended Application |
| :--- | :--- | :--- | :--- |
| **Primary Blue** | `#3B82F6` | `rgb(59, 130, 246)` | Primary buttons, active tabs, prominent links, brand badges |
| **Light Blue** | `#60A5FA` | `rgb(96, 165, 250)` | Hover states, secondary highlights, subtle accents |
| **Very Light Blue** | `#EFF6FF` | `rgb(239, 246, 255)` | Card backgrounds, pill tags, interactive hover fills |
| **Main Background** | `#F8FBFF` | `rgb(248, 251, 255)` | Page canvas, general layout background |
| **Soft Sky** | `#E0F2FE` | `rgb(224, 242, 254)` | Section dividers, badge backgrounds, input focus halos |
| **Cyan Accent** | `#06B6D4` | `rgb(6, 182, 212)` | Subtle feature highlights, secondary CTA gradients |
| **Success** | `#22C55E` | `rgb(34, 197, 94)` | Approved status, completed steps, high ATS score |
| **Warning** | `#F59E0B` | `rgb(245, 158, 11)` | Changes requested, draft status, intermediate alerts |
| **Error** | `#EF4444` | `rgb(239, 68, 68)` | Rejected status, destructive actions, validation errors |
| **Main Text** | `#0F172A` | `rgb(15, 23, 42)` | High-contrast body text, headings, prominent titles |
| **Secondary Text**| `#64748B` | `rgb(100, 116, 139)` | Subtitles, metadata, timestamps, input placeholders |
| **Border** | `#DBEAFE` | `rgb(219, 234, 254)` | Card borders, input outlines, table cell dividers |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Surface containers, card backgrounds, elevated sheets |

### 2.2. Preferred Gradients (Use Sparingly)
- **Primary Brand Gradient:**
  ```css
  background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
  ```
  *Usage:* Limited to primary hero badges, key CTA buttons, and highlighted completion rings.

---

## 3. Typography Hierarchy

### 3.1. Font Families
- **Primary Body & Interface:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Headings & Display:** `Plus Jakarta Sans, Inter, sans-serif`

### 3.2. Scale & Hierarchy

| Element | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title (H1 Display)** | 44px – 56px | 800 (Extrabold) | 1.15 | -0.025em |
| **Page Heading (H1)** | 32px – 36px | 700 (Bold) | 1.25 | -0.02em |
| **Section Heading (H2)** | 24px – 28px | 600 (Semibold) | 1.3 | -0.015em |
| **Card / Subsection (H3)**| 18px – 20px | 600 (Semibold) | 1.4 | -0.01em |
| **Body Large** | 16px | 400 / 500 | 1.5 | normal |
| **Body Regular** | 14px | 400 (Regular) | 1.5 | normal |
| **Caption / Metadata** | 12px | 500 (Medium) | 1.4 | +0.01em |
| **Micro Tag** | 11px | 600 (Semibold) | 1.2 | +0.03em |

---

## 4. Spacing, Radii & Elevation

### 4.1. Corner Radii
- **Cards & Containers:** `16px` (range `14px`–`20px`, Tailwind `rounded-2xl` or `rounded-xl`)
- **Buttons & Interactive Controls:** `10px`–`12px` (Tailwind `rounded-lg` or `rounded-xl`)
- **Badges & Pill Tags:** `9999px` (Tailwind `rounded-full`)
- **Input Fields:** `10px` (Tailwind `rounded-lg`)

### 4.2. Box Shadows & Elevations
- **Subtle Surface (Card standard):**
  `box-shadow: 0 1px 3px 0 rgba(59, 130, 246, 0.05), 0 1px 2px -1px rgba(59, 130, 246, 0.05);`
- **Elevated Hover (Card interaction):**
  `box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.12), 0 8px 10px -6px rgba(59, 130, 246, 0.08);`
- **Modal / Dropdown Overlay:**
  `box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.04);`

---

## 5. Core UI Component Specifications

### 5.1. Buttons
- **Primary Button:**
  - Background: `#3B82F6` (Hover: `#2563EB`)
  - Text: `#FFFFFF`, Font weight: 600, Radius: `10px`
  - Padding: `10px 20px` (Medium), `12px 28px` (Large)
  - Transition: `all 150ms ease-in-out`
- **Secondary Button:**
  - Background: `#EFF6FF` (Hover: `#DBEAFE`)
  - Text: `#1D4ED8`, Border: `1px solid #DBEAFE`, Radius: `10px`
- **Outline Button:**
  - Background: Transparent, Border: `1px solid #DBEAFE` (Hover: `#3B82F6`, Background: `#F8FBFF`)
  - Text: `#0F172A`
- **Destructive Button:**
  - Background: `#FEE2E2`, Text: `#DC2626`, Border: `1px solid #FECACA` (Hover: `#DC2626`, Text: `#FFFFFF`)

### 5.2. Form Inputs
- Background: `#FFFFFF`
- Border: `1px solid #DBEAFE`
- Focus: `border-color: #3B82F6`, `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15)`
- Placeholder: `#94A3B8`
- Error State: `border-color: #EF4444`, `box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15)`

### 5.3. Project & Job Cards
- Border: `1px solid #DBEAFE`
- Background: `#FFFFFF`
- Padding: `20px` to `24px`
- Radius: `16px`
- Smooth hover elevation with `-translate-y-1` micro-interaction.

### 5.4. Status Badges
- **Draft:** Background `#F1F5F9`, Text `#475569`, Border `#E2E8F0`
- **Under Review:** Background `#FEF3C7`, Text `#B45309`, Border `#FDE68A`
- **Approved / Published:** Background `#DCFCE7`, Text `#15803D`, Border `#BBF7D0`
- **Changes Requested:** Background `#FFF7ED`, Text `#C2410C`, Border `#FFEDD5`
- **Rejected:** Background `#FEE2E2`, Text `#B91C1C`, Border `#FECACA`

---

## 6. Responsive Breakpoints

| Breakpoint | Width (px) | Grid / Layout Behavior |
| :--- | :--- | :--- |
| **Mobile (`sm`)** | `< 640px` | Single-column cards, drawer navigation, collapsible filters |
| **Tablet (`md`)** | `640px – 1023px`| Two-column project/job grids, collapsed dashboard sidebar |
| **Desktop (`lg`)** | `1024px – 1279px`| Three-column project grids, persistent sidebar |
| **Wide Screen (`xl`)**| `≥ 1280px` | Max-width container `1280px` (`max-w-7xl`), centered alignment |
