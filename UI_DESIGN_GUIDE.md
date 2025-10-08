# seekingSame App - UI Design Guide

This document describes the exact visual design system used in the seekingSame mobile app. Use this as a reference when creating new screens or components to maintain visual consistency.

---

## Color Palette

### Primary Colors (Main Brand Colors)

**Primary Accent - Purple**
- Hex: `#a855f7`
- Usage: Primary buttons, active tab indicators, links, primary actions, selected states
- Where: Tab bar indicator, form buttons, active icons

**Secondary Accent - Teal**
- Hex: `#3c95a6`
- Usage: Secondary actions, badges, property type labels, accents
- Where: Property badges, host badges, category pills, prices, icons

**Tertiary Accent - Pink**
- Hex: `#FF6B9D`
- Usage: Favorites, map markers, special highlights
- Where: Favorite heart icons, map property markers, special buttons

### Gradient Colors (Auth Screens)

**Login/Signup Gradient**
- Start: `#cb54f8` (purple)
- End: `#6095a6` (teal)
- Direction: Diagonal (top-left to bottom-right)

### Background Colors

**Light Mode**
- Main Background: `#ffffff` (white)
- Screen Background: `#f6f7fb` (very light blue-gray)
- Surface: `#f1f5f9` (light gray-blue)
- Surface Soft: `#eef2f7` (softer gray)
- Surface Border: `#e8ecf4` (subtle border)

**Dark Mode**
- Main Background: `#151718` (very dark gray)
- Screen Background: `#0a0a0a` (almost black)
- Surface: `#0f172a` (dark blue-gray)
- Surface Soft: `#111827` (dark gray)
- Surface Border: `#1f2937` (dark border)

### Text Colors

**Light Mode**
- Primary Text: `#11181C` (almost black)
- Muted Text: `#6b7280` (medium gray)
- Placeholder: `#9ca3af` (light gray)
- Icon Default: `#687076` (gray)

**Dark Mode**
- Primary Text: `#ECEDEE` (off-white)
- Muted Text: `#9ca3af` (light gray)
- Placeholder: `#9aa3b2` (blue-gray)
- Icon Default: `#9BA1A6` (light gray)

### Status Colors

**Success**
- Light: `#10b981` (green)
- Dark: Same

**Warning/Pending**
- Light: `#f59e0b` (amber/orange)
- Dark: Same

**Error/Danger**
- Light: `#ef4444` (red)
- Dark: `#f87171` (lighter red)

**Info**
- Light: `#6366f1` (indigo)
- Dark: Same

### Special Colors

**Star Rating**: `#FFD700` (gold)
**Active/Online**: `#10b981` (green)
**Google Button**: `#db4437` (Google red)
**Apple Button**: `#000000` (black)

---

## Typography

### Font Family
- **iOS**: System UI fonts (San Francisco)
  - Default: `system-ui`
  - Rounded: `ui-rounded`
  - Monospace: `ui-monospace`
- **Android**: System default (`normal`, `monospace`)

### Text Sizes (Common Patterns)
- **Large Heading**: 28-32px, weight: 700-800
- **Section Title**: 20-24px, weight: 700
- **Card Title**: 16-18px, weight: 600
- **Body Text**: 14-15px, weight: 400-500
- **Small/Meta Text**: 12-13px, weight: 400
- **Tiny Text**: 10-11px, weight: 400

---

## Component Styles

### Cards

**Standard Card**
```
Background: C.surface (light: #f1f5f9, dark: #0f172a)
Border: 1px solid C.surfaceBorder
Border Radius: 12-16px
Padding: 16-20px
Shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2
}
```

**Property Card (Homepage)**
```
Background: C.surface
Border Radius: 16px
Image Height: 180px
Image Border Radius: 12px (top)
Padding: 12px
Shadow: Light subtle shadow
```

### Buttons

**Primary Button**
```
Background: #cb54f8 (purple gradient option) or #a855f7
Text Color: #ffffff
Border Radius: 12px
Padding: 14-16px vertical
Font Weight: 600
Shadow: {
  shadowColor: '#6a0dad',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4
}
```

**Secondary Button**
```
Background: #3c95a6 (teal)
Text Color: #ffffff
Border Radius: 12px
Padding: 12-14px vertical
Font Weight: 600
```

**Outline Button**
```
Background: transparent
Border: 1px solid #a855f7 or #3c95a6
Text Color: #a855f7 or #3c95a6
Border Radius: 12px
Padding: 12px vertical
```

**Destructive Button**
```
Background: rgba(239, 68, 68, 0.1)
Text Color: #ef4444
Border Radius: 12px
Icon Color: #ef4444
```

### Input Fields

**Standard Input**
```
Background: #f8fafc (light) or #1f2937 (dark)
Border: 1px solid #e2e8f0
Border Radius: 12px
Padding: 12-14px
Font Size: 15px
Placeholder Color: #9ca3af
Text Color: #1f2937 (light) or #e5e7eb (dark)

Focus State:
  Border Color: #a855f7
```

### Badges

**Property Type Badge**
```
Background: #3c95a6
Text Color: #ffffff
Border Radius: 8px
Padding: 4px 8px
Font Size: 10-11px
Font Weight: 600
```

**Status Badge**
```
Active: Background #10b981
Pending: Background #f59e0b
Inactive: Background #6b7280
Text Color: #ffffff
Border Radius: 12px
Padding: 4px 10px
```

### Icons

**Sizes**
- Tiny: 14px
- Small: 16-18px
- Medium: 20-24px
- Large: 28-32px
- Extra Large: 48px (success/error states)

**Colors**
- Default: C.icon (#687076 light, #9BA1A6 dark)
- Active/Selected: C.tint (#a855f7)
- Accent: #3c95a6
- Favorite: #FF6B9D
- Star: #FFD700

### Tab Bar (Floating)

```
Container:
  Background: C.surface
  Border: 1px solid C.surfaceBorder
  Border Radius: 28px
  Padding: 8px
  Margin: 20px horizontal
  Position: Absolute bottom
  Shadow: Subtle elevation

Active Indicator:
  Background: #a855f7
  Border Radius: 20px
  Animated slide between tabs

Tab Icons:
  Active: #ffffff
  Inactive: C.textMuted
```

---

## Layout Patterns

### Screen Container
```
Background: C.screenBg (#f6f7fb light, #0a0a0a dark)
Padding: 16-20px horizontal
Safe Area: Respected
```

### Section Spacing
- Between sections: 20-24px
- Section title margin bottom: 12-16px
- Card spacing: 12-16px

### Header Heights
- Standard header: 60-80px
- Search bar height: 48-52px
- Tab bar height: ~60px + safe area

---

## Shadows and Elevation

### Light Shadow (Cards)
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.05
shadowRadius: 8
elevation: 2 (Android)
```

### Medium Shadow (Buttons, Modals)
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.1
shadowRadius: 12
elevation: 4 (Android)
```

### Strong Shadow (Floating Elements)
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.15
shadowRadius: 16
elevation: 8 (Android)
```

---

## Border Radius Guide

- Small elements (badges, small buttons): 8px
- Standard (inputs, cards): 12px
- Medium (larger cards): 16px
- Large (images, major sections): 18-20px
- Pill shape: 24-28px (circular buttons, tabs)

---

## Animation & Transitions

### Spring Animations (Tab Bar)
```
damping: 20
stiffness: 180
mass: 0.6
overshootClamping: true
```

### Fade Animations (Screen Entry)
```
duration: 800ms
useNativeDriver: true
```

### Haptic Feedback
- Light tap: `Haptics.ImpactFeedbackStyle.Light`
- Used on: Tab switches, button presses

---

## Common UI Patterns

### Search Bar
```
Background: #ffffff (light) or C.surface (dark)
Border: 1px solid #e1e1e1
Border Radius: 24px (pill shape)
Padding: 12px 16px
Icon: Search icon left, close icon right
Icon Color: #666
```

### Filter Button
```
Background: C.surface
Border: 1px solid C.surfaceBorder
Border Radius: 12px
Padding: 10px 16px
Icon Size: 18-20px
Active State: Background #3c95a6, Icon/Text #ffffff
```

### List Item / Row Item
```
Background: C.surface
Padding: 16px
Border Bottom: 1px solid C.surfaceBorder (except last)
Icon: Left aligned, C.tint color
Title: Font size 15-16px, weight 500
Description: Font size 13px, color C.textMuted
Chevron: Right aligned, C.icon color
```

### Avatar/Profile Image
```
Border Radius: 50% (circular)
Border: 2px solid #ffffff (light) or C.surface (dark)
Sizes: 40px (small), 60px (medium), 72px (large)
Fallback: Initials on colored background
```

---

## Quick Reference: Most Used Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary Action | `#a855f7` | `#a855f7` |
| Secondary Action | `#3c95a6` | `#3c95a6` |
| Favorite/Accent | `#FF6B9D` | `#FF6B9D` |
| Screen BG | `#f6f7fb` | `#0a0a0a` |
| Card BG | `#f1f5f9` | `#0f172a` |
| Text Primary | `#11181C` | `#ECEDEE` |
| Text Muted | `#6b7280` | `#9ca3af` |
| Border | `#e8ecf4` | `#1f2937` |
| Success | `#10b981` | `#10b981` |
| Error | `#ef4444` | `#f87171` |
| Star Rating | `#FFD700` | `#FFD700` |

---

## Design Principles

1. **Consistency**: Use the theme constants (`Colors[scheme]`) from `constants/theme.ts`
2. **Spacing**: Follow 4px grid (4, 8, 12, 16, 20, 24px)
3. **Accessibility**: Maintain contrast ratios, respect color schemes
4. **Feedback**: Use haptics and animations for interactions
5. **Elevation**: Layer UI with shadows (bottom to top: content → cards → modals → floating)

---

## Code Example

```typescript
import { Colors } from '@/constants/theme';
import { useColorScheme, StyleSheet } from 'react-native';

const scheme = useColorScheme() ?? 'light';
const C = Colors[scheme];

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.screenBg,
    padding: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '400',
  }
});
```
