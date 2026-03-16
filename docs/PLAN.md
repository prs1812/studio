# Unified Design Studio

## Context

Eight standalone design/generative art tools spread across `~/Development/art` (7 tools) and `~/Development/dither` (web app only — ignoring the Illustrator plugin) share identical aesthetics and duplicated UI code but live in separate codebases. The goal is to combine them into a single polished web app where you can switch between tools fluidly, with shared UI components, theming, and utilities. New repo at `~/Development/studio`, deployed to its own domain.

## Stack

- **Vite + React 19 + TypeScript** (strict mode)
- **Tailwind CSS v4 + shadcn/ui** for controls and layout
- **react-router-dom v7** for path-based routing (`/blocks`, `/topo`, etc.)
- **p5.js** (instance mode) for 7 canvas tools
- **mp4-muxer** for video export (gradients, lines)
- **react-colorful** for color pickers
- **vitest** for utility tests

Why not Next.js: Pure client-side canvas app. No SEO, no server data, no content pages. SSR actively fights p5.js/Three.js (would need `dynamic(() => import(...), { ssr: false })` everywhere). Vite + React gives everything needed with none of the overhead.

---

## Design Language (Based on Dither)

Source: `/Users/joshpigford/Development/dither/packages/web/index.html`

### Tailwind Config — Custom Theme

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        canvas: '#000000',
        sidebar: '#0a0a0a',
        border: {
          DEFAULT: '#1a1a1a',
          control: '#333333',
          hover: '#555555',
          focus: '#888888',
        },
        text: {
          primary: '#ededed',
          secondary: '#888888',
          tertiary: '#666666',
          muted: '#444444',
        },
        accent: '#ffffff',
        control: {
          bg: '#0a0a0a',
          track: '#333333',
          thumb: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': '11px',
        xs: '12px',
        sm: '13px',
        lg: '18px',
      },
      spacing: {
        sidebar: '280px',
        toolbar: '48px',
      },
      borderRadius: {
        control: '6px',
      },
      transitionDuration: {
        control: '150ms',
      },
    },
  },
}
```

### Design Rules

1. **No shadows, no gradients on UI, no cards.** Hierarchy through font size and color alone.
2. **All borders:** `1px solid`, `border-radius: 6px`.
3. **All transitions:** `150ms`.
4. **Slider track:** `#333`, 2px height, `border-radius: 1px`. Thumb: `#fff`, 14px circle, `box-shadow: 0 0 0 1px rgba(0,0,0,0.3)`.
5. **Primary button:** `bg-accent text-canvas w-full`. Hover: `bg-[#e0e0e0]`.
6. **Secondary button:** `bg-transparent border border-border-control text-text-primary`. Hover: `border-border-hover`.
7. **Selects:** `bg-control-bg border-border-control`, custom SVG dropdown arrow.
8. **Scrollbar:** `4px` wide, `#333` thumb, transparent track.
9. **Font smoothing:** `antialiased` globally.
10. **Numeric displays:** `font-variant-numeric: tabular-nums`, mono font.

---

## Repo Structure

```
studio/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── app.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── select.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── switch.tsx
│   │   │   └── tooltip.tsx
│   │   ├── app-shell.tsx
│   │   ├── tool-switcher.tsx
│   │   ├── sidebar.tsx
│   │   ├── canvas-area.tsx
│   │   └── controls/
│   │       ├── slider-control.tsx
│   │       ├── select-control.tsx
│   │       ├── color-control.tsx
│   │       ├── switch-control.tsx
│   │       ├── gradient-editor.tsx
│   │       ├── palette-editor.tsx
│   │       ├── section.tsx
│   │       └── button-row.tsx
│   ├── hooks/
│   │   ├── use-p5.ts
│   │   ├── use-three.ts
│   │   └── use-settings.ts
│   ├── lib/
│   │   ├── export.ts
│   │   ├── texture.ts
│   │   ├── color.ts
│   │   └── math.ts
│   ├── types/
│   │   └── tools.ts
│   └── tools/
│       ├── registry.ts
│       ├── topo/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       ├── blocks/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       ├── organic/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       ├── dither/
│       │   ├── index.tsx
│       │   ├── engine.ts
│       │   ├── svg.ts
│       │   └── types.ts
│       ├── gradients/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       ├── plotter/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       ├── ascii/
│       │   ├── index.tsx
│       │   ├── sketch.ts
│       │   └── types.ts
│       └── lines/
│           ├── index.tsx
│           ├── sketch.ts
│           └── types.ts
```

---

## Core Types

```ts
// src/types/tools.ts
import { ComponentType } from 'react'

export interface ToolDefinition {
  id: string
  name: string
  icon: string
  component: ComponentType
}

export interface ColorStop {
  color: string
  position: number // 0-100
}
```

---

## App Shell

### Layout

```
┌──────────┬─────────────────────────┬──────────────┐
│ToolSwitch│     Canvas Area         │   Sidebar    │
│  48px    │      flex: 1            │    280px     │
│          │                         │              │
│  [icon]  │                         │  [controls]  │
│  [icon]  │                         │              │
│  [icon]  │                         │              │
└──────────┴─────────────────────────┴──────────────┘
```

### `src/main.tsx`
- BrowserRouter + App mount

### `src/app.tsx`
- Routes with lazy-loaded tool components
- Redirect `/` to last tool from localStorage

### `src/components/app-shell.tsx`
- Three-column flex layout
- Left: ToolSwitcher (48px), Center: canvas (flex: 1), Right: Sidebar (280px)

### `src/components/tool-switcher.tsx`
- Vertical NavLinks with tooltips
- Active: `bg-[#1a1a1a] text-accent`, Inactive: `text-text-tertiary`
- Stores last tool in localStorage

### `src/components/sidebar.tsx`
- 280px, `bg-sidebar`, `border-l border-border`
- Takes optional `footer` prop — rendered pinned at the bottom (action buttons always visible)
- Settings content scrolls in `flex-1 overflow-y-auto` above the footer

### `src/components/canvas-area.tsx`
- `flex-1 bg-canvas`, forwardRef for p5/Three.js mounting

---

## Shared Control Components

### `slider-control.tsx`
Label + value display row, shadcn Slider restyled (2px track, 14px white thumb).

### `select-control.tsx`
Label + shadcn Select, styled `bg-control-bg border-border-control`.

### `color-control.tsx`
Label + 28x28 swatch button → Popover with HexColorPicker + hex input.

### `switch-control.tsx`
Label + shadcn Switch, dark theme restyled.

### `section.tsx`
Collapsible section. Header: `text-2xs uppercase tracking-wide text-text-tertiary`.

### `button-row.tsx`
`flex flex-col gap-1`. Passed as `footer` prop to Sidebar so action buttons stay pinned while settings scroll.

### `gradient-editor.tsx`
Color stop rows (swatch + position slider + remove). Add button. Used by organic, gradients, lines.

### `palette-editor.tsx`
Color rows (swatch + hex + weight slider). Preset buttons. Used by dither.

---

## Hooks

### `use-settings.ts`
```ts
function useSettings<T>(key: string, defaults: T): [T, setter, reset]
```
localStorage persistence with debounced writes (200ms). Merges with defaults on load.

### `use-p5.ts`
```ts
function useP5(containerRef, sketchFn, settings, options?: { animated?: boolean }): MutableRefObject<p5 | null>
```
Instance mode lifecycle. settingsRef stays in sync. Calls redraw() unless animated. Cleans up on unmount.

---

## Tool Registry

```ts
export const tools: ToolDefinition[] = [
  { id: 'topo', name: 'Topographic', icon: '◎', component: lazy(() => import('./topo')) },
  { id: 'blocks', name: 'Blocks', icon: '▦', component: lazy(() => import('./blocks')) },
  { id: 'organic', name: 'Organic', icon: '~', component: lazy(() => import('./organic')) },
  { id: 'dither', name: 'Dither', icon: '▒', component: lazy(() => import('./dither')) },
  { id: 'gradients', name: 'Gradients', icon: '◐', component: lazy(() => import('./gradients')) },
  { id: 'plotter', name: 'Plotter', icon: '✒', component: lazy(() => import('./plotter')) },
  { id: 'ascii', name: 'ASCII', icon: 'A>', component: lazy(() => import('./ascii')) },
  { id: 'lines', name: 'Lines', icon: '≋', component: lazy(() => import('./lines')) },
]
```

---

## Shared Utilities

### `lib/color.ts`
`hexToRgb`, `rgbToHex`, `lerpColor`, `getColorAtPosition`, `randomHexColor`

### `lib/math.ts`
`seededRandom`, `mapRange`, `constrain`, `randomInt`

### `lib/texture.ts`
`applyGrain`, `applyCanvasTexture` — extracted from topo, blocks, organic, plotter.

### `lib/export.ts`
`exportPNG`, `exportSVG`, `generateFilename`, `createRecorder` (MP4 via mp4-muxer)

---

## Per-Tool Specifications

### Tool 1: Topo (Topographic Map Generator)

**Source:** `~/Development/art/topo/sketch.js` (924 lines)
**Renderer:** p5.js, `noLoop()` + `redraw()`
**Canvas:** Responsive square, capped at 800px

**Settings:**
- seed, contourLevels (5-50), noiseScale (0.002-0.020), octaves (1-8), falloff (0.30-0.70)
- strokeWeight (0.5-5.0), wobble (0-30), roughness (0-50), smoothing (0-100)
- bgColor, colorMode (single/elevation/palette), lineColor, palette, opacity, grain, margin

**Sections:** Terrain, Stroke, Color, Effects, Actions (Randomize/Reset/Download)

**Palettes:** mono, topo, ocean, earth, sunset, forest, heat

---

### Tool 2: Blocks (Geometric Compositions)

**Source:** `~/Development/art/blocks/sketch.js` (1050 lines)
**Renderer:** p5.js, `noLoop()` + `redraw()`
**Canvas:** Fixed (800x800, 1024x768, or 768x1024)

**Settings:**
- seed, patternType (mondrian/grid/horizontal/diagonal), blockCount, complexity
- lineWeight, rotation, palette, 5 custom colors, lineColor, canvasSize
- asymmetry, colorDensity, gridDivisions, texture, grain
- halftone, halftoneSize, halftoneMisalign, halftoneAngle, edgeWobble

**Sections:** Pattern, Layout, Color, Effects, Actions

**Palettes:** mondrian, neo-mondrian, warm, cool, monochrome, custom

---

### Tool 3: Organic (Flow Field / Path Visualizer)

**Source:** `~/Development/art/organic/sketch.js` (1065 lines)
**Renderer:** p5.js, `noLoop()` + `redraw()`
**Canvas:** 800x800 or 1920x1080

**Settings:**
- canvasSize, bgColor, pathType (flowField/wandering/waves), pathCount, lineWeight, seed
- wobble, roughness, taper, gradientType, palette, colorStops, grainAmount, textureAmount, padding
- Algorithm-specific nested settings per pathType

**Sections:** Canvas, Paths, Algorithm (dynamic), Style, Color, Effects, Actions

**First tool using:** GradientEditor component.

---

### Tool 4: Dither (Vector Dithering)

**Source:** `~/Development/dither/packages/core/` + `packages/web/app.js`
**Renderer:** Canvas 2D (no p5, no Three.js)
**Canvas:** Dynamic (image or gradient based)

**Settings:**
- sourceType, gradientType, gradientAngle, aspectRatio, gradientWidth/Height
- patternType (bayer2/4/8, halftone, lines, crosses, dots, grid, scales)
- ditherMode, ditherStyle, shapeType, cellSize, angle, scale, offsetX/Y
- colorCount, colors with weights

**Sections:** Source, Pattern, Parameters, Palette (with presets), Export (SVG + PNG)

**Files ported:**
- `core/dither.js` + `core/bayer.js` + `core/gradient.js` + `core/patterns.js` → `engine.ts`
- `core/svg.js` → `svg.ts`
- `web/app.js` → `index.tsx` (rewritten as React)

---

### Tool 5: Gradients (Abstract Gradient Generator)

**Source:** `~/Development/art/gradients/sketch.js` (1158 lines)
**Renderer:** p5.js, `noLoop()` or `loop()` (animated)
**Canvas:** Fixed 1024x1024

**Settings:**
- colorStops, flowAngle, noiseScale, noiseIntensity, curveDistortion, noiseOctaves
- depthIntensity, highlightStrength, shadowStrength, foldScale
- grainIntensity, grainSize, brightness, contrast, saturation
- isAnimating, animationSpeed

**Sections:** Colors, Flow, Depth & Light, Grain, Adjustments, Animation, Actions

**Special:** MP4 export via mp4-muxer. 18 palette presets for Randomize.

---

### Tool 6: Plotter (Algorithmic Art Generator)

**Source:** `~/Development/art/plotter/sketch.js` (2241 lines)
**Renderer:** p5.js, `noLoop()` + `redraw()`
**Canvas:** Selectable square (600/800/1000/1200)

**Settings:** (40+ settings, nested sub-objects for pattern/brush types)
- Core: seed, canvasSize, bgColor, margin, patternType (6 types: dotGrid/flowField/concentric/waves/hatching/geometric)
- Grid (dotGrid): columns, rows, jitter
- Shape (dotGrid/geometric): shapeType (circle/square/line/cross/ring/diamond), minSize, maxSize, strokeWeight, filled, rotation
- Organic: wobble, roughness, strokeTaper
- Brush (flowField/concentric/waves/hatching): brushType (normal/stippled/multiStroke/calligraphic/stamp) with type-specific nested sub-settings
- Noise: noiseScale, noiseIntensity
- Pattern-specific: flowField (lineCount/stepLength/steps), concentric (count/spacing), waves (count/amplitude/frequency), hatching (angle/spacing/crossHatch), geometric (shape/size)
- Colors: palette (12 presets), colors[] array
- Texture: textureAmount (paper fibers + scratches + grain via canvas 2D API)

**Sections:** Canvas, Pattern (conditional sub-controls), Shape (conditional), Brush (conditional with sub-controls), Organic, Noise, Color, Texture, Actions

---

### Tool 7: ASCII (ASCII Art Generator)

**Source:** `~/Development/art/ascii/index.html` (4605 lines inline)
**Renderer:** p5.js, `noLoop()` + `redraw()`
**Canvas:** Responsive

**Settings:** (60+ settings)
- Core: fontSize, charSet, useColors, colorSaturation, bgColor, textColor, letterSpacing, lineHeight, contrast, brightness, invert, opacity, showOriginal
- Character mixing: enabled, mode, per-set configs, hybrid blend, zone mapping, spatial noise
- Size variation: enabled, mode, config, detail/texture/focus sub-settings
- Texture: grain, texture amount
- Sketch overlay: enabled, style (5 types), density, wobble, strokeWeight, opacity, reactTo, thresholds, color settings, style-specific sub-settings, draw order, blend mode

**Sections:** Image upload, Character Set, Character Mixing, Size Variation, Color, Rendering, Texture, Sketch, Actions

**Special:** Requires image upload. Largest control surface. Uses imagetracerjs.

---

### Tool 9: Lines (Generative Line Art)

**Source:** `~/Development/art/lines/sketch.js` (4750 lines)
**Renderer:** p5.js, `loop()` or `noLoop()`
**Canvas:** Fullscreen responsive

**Settings:** (65+ settings)
- Core: shape, frequency, amplitude, lineCount, spacing, padding, thickness, bgColor, lineColor, noise, blendMode
- Lissajous: freqA/B, phase, scale, resolution, oscillon mode/layers/spread
- Organic: weightVar, wobble, taper, lineBreaks, morsePattern, spacingVar, rotationJitter, opacityVar, colorDrift, perlinFlow, freqVar, octaves
- Watercolor: enabled + wetness, pigment, layers, edgeDarkening
- Glass/Lens: blur, refraction, chromaticAb, pixelate (each with sub-settings)
- Halftone: enabled + type, size, angle, softness, coverage
- CRT/VHS: each with sub-settings
- Gradient overlay: enabled, type, stops, animation
- Background gradient: enabled, type, angle, stops
- Animation: speed, isPlaying

**Sections:** Shape, Core, Lissajous, Background, Line Color, Gradient Overlay, Organic Effects, Advanced Variations, Texture, Watercolor, Blend Mode, Glass/Lens, Halftone, CRT/VHS, Animation, Actions

**Special:** Most complex tool. Two gradient editors. MP4 export. WEBGL buffer disposal critical.

---

## Implementation Phases

**Current phase: 9**

- [x] **Phase 1: Scaffold + App Shell** — Vite + React 19 + TS strict + Tailwind v4 + shadcn. Three-column layout (ToolSwitcher / CanvasArea / Sidebar). 9 lazy-loaded routes with localStorage redirect. Dithered squircle icons per tool with color palettes. Dark theme. Done.
- [x] **Phase 2: Shared Controls** — 6 shadcn/ui primitives (button, slider, select, popover, collapsible, switch) + 8 control components (section, slider-control, select-control, color-control, switch-control, button-row, gradient-editor, palette-editor). PaletteColor type added. Topo wired with demo controls for visual verification. Done.
- [x] **Phase 3: Hooks + Lib Utilities** — Removed `@types/p5` (conflicts with p5 v2 native types). Created `useSettings` (localStorage with 200ms debounced writes), `useP5` (instance mode lifecycle with settingsRef sync and static/animated modes), `useThree` (renderer/scene/camera setup with ResizeObserver). Lib utilities: `math.ts` (seededRandom, mapRange, constrain, randomInt), `color.ts` (hexToRgb, rgbToHex, lerpColor, getColorAtPosition, randomHexColor), `texture.ts` (applyGrain, applyCanvasTexture), `export.ts` (generateFilename, exportPNG, exportSVG, createRecorder). 23 tests passing. Done.
- [x] **Phase 4: Port Topo** — First complete tool. Validates entire architecture. Ported all 924 lines to p5 v2 instance mode. Key discoveries: `curveVertex` renamed to `splineVertex` in p5 v2; p5 v2 constructor is async (uses rAF), requiring `hitCriticalError` flag in `useP5` cleanup for StrictMode; tool settings types must use `type` not `interface` for `useSettings` compatibility; `connectSegments` needed spatial hash (O(n) vs O(n²)); terrain computation cached separately from rendering for slider responsiveness; grain uses canvas 2D `getImageData` at `pixelDensity()`-scaled dimensions for performance. Done.
- [x] **Phase 5: Port Blocks** — Adds palette system with 5 color pickers, canvas size switching. Key discoveries: `pixelDensity(1)` essential for tools with per-pixel effects (texture/grain/halftone) — blocks are flat geometric shapes that don't benefit from retina; pre-computed noise lookup table at half resolution avoids expensive per-pixel `p.noise()` calls; `seededRandom` from `lib/math.ts` (not `p.randomSeed`/`p.random`) for deterministic layout and color assignment; geometry cached separately from color assignment for slider responsiveness. Done.
- [x] **Phase 6: Port Organic** — First use of GradientEditor, dynamic algorithm-specific controls. 3 path types (flowField/wandering/waves) with per-algorithm settings sections. 10 palette presets + custom gradient via ColorStop editor. Organic effects (wobble/roughness/taper), texture and grain post-processing. Path generation cached separately from rendering for slider responsiveness. Done.
- [x] **Phase 7: Port Dither** — Canvas 2D (no p5/Three.js). Bayer matrices, pattern thresholds, gradient generation, and dithering core consolidated into `engine.ts`. Compact inline PaletteEditor (swatch + hex + weight slider + %). SVG export via `svg.ts`. Image upload + drag-and-drop. 4 palette presets. Default: Game Boy palette, square shape, 45° linear gradient. Done.
- [x] **Phase 8: Port Gradients** — First WEBGL shader tool. Fragment shader ported verbatim (simplex noise, FBM, domain warping, glass waves, gradient interpolation, lighting/fresnel, grain, adjustments). Offscreen `createGraphics(WEBGL)` rendered to 2D main canvas. Animation toggle via internal `wasAnimating` flag (`p.loop()`/`p.noLoop()` switching) without `useP5` animated mode. MP4 recording via `createRecorder` with forced animation. 18 preset palettes + HSL random generation. Cached color stop parsing and container size to avoid per-frame allocations/DOM reads during animation. GradientEditor and PaletteEditor both use react-colorful HexColorPicker popover for consistent color picking across tools. Done.
- [x] **Phase 9: Port Plotter** — 6 pattern types (dotGrid/flowField/concentric/waves/hatching/geometric) with conditional controls per pattern. 5 brush types (normal/stippled/multiStroke/calligraphic/stamp) with conditional sub-settings. Organic distortion (wobble/roughness/taper). Layer system simplified to flat `colors[]` array with 12 palette presets. Shape controls for dotGrid/geometric, brush controls for path-based patterns. Custom paper texture (fibers + scratches + grain) via canvas 2D API. Noise sliders need `decimals` prop for fractional display. Done.
- [ ] **Phase 10: Port ASCII** — 4605 lines inline JS extraction. 60+ settings. Image upload.
- [ ] **Phase 11: Port Lines** — Largest tool. Two gradient editors. Animation + video. 65+ settings. WEBGL buffer cleanup.
- [ ] **Phase 12: Polish** — SVG icons, keyboard shortcuts, responsive canvas, mobile layout, page titles, favicon, deploy.

---

## p5 Instance Mode Conversion Checklist

For each tool, prefix with `p.`:

**Functions:** background, createCanvas, resizeCanvas, noLoop, loop, redraw, fill, noFill, stroke, noStroke, strokeWeight, rect, ellipse, circle, line, arc, point, beginShape, endShape, vertex, splineVertex (was curveVertex in p5 v1), push, pop, translate, rotate, scale, noise, noiseDetail, noiseSeed, randomSeed, random, map, constrain, lerp, dist, color, red, green, blue, lerpColor, colorMode, loadPixels, updatePixels, createGraphics, save, textSize, textAlign, text, blendMode, frameRate, pixelDensity, drawingContext, etc.

**Constants:** PI, TWO_PI, HALF_PI, ROUND, SQUARE, BLEND, ADD, MULTIPLY, SCREEN, OVERLAY, WEBGL, P2D, CLOSE, CENTER, LEFT, RIGHT, BASELINE, etc.

**Properties:** width, height, mouseX, mouseY, frameCount, deltaTime, pixels, drawingContext

**Ambiguous:** `random` (p.random vs Math.random), `map` (p.map vs Array.map), math functions (prefer Math.xxx for non-p5 math)

**Delete:** All DOM helpers (createDiv, createSlider, etc.) — replaced by React.

---

## Testing Strategy

- TypeScript strict mode as primary safety net
- Vitest for lib/ utilities only (~20-30 tests)
- No UI or E2E tests — visual tools verified by looking at them

## Verification (per tool)

1. App loads, tool in switcher
2. Canvas renders correctly
3. Every control updates canvas
4. Conditional controls show/hide correctly
5. Randomize works without crashes
6. Reset returns to defaults
7. Download saves correct format
8. Settings persist across reload
9. Tool switching preserves state
10. No WebGL leaks or orphaned canvases
11. No console errors

---

## Source Files Reference

| Tool | Source | Lines | Renderer |
|------|--------|-------|----------|
| Topo | `art/topo/sketch.js` | 924 | p5 |
| Blocks | `art/blocks/sketch.js` | 1050 | p5 |
| Organic | `art/organic/sketch.js` | 1065 | p5 |
| Dither | `dither/packages/core/` + `web/app.js` | 829 | Canvas 2D |
| Gradients | `art/gradients/sketch.js` | 1158 | p5 |
| Plotter | `art/plotter/sketch.js` | 2241 | p5 |
| ASCII | `art/ascii/index.html` | 4605 | p5 |
| Lines | `art/lines/sketch.js` | 4750 | p5 |
| **Total** | | **~16,600** | |
