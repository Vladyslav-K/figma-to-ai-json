# Figma JSON Decoder for AI

When the user provides a JSON export from the "Figma to AI JSON" plugin, use this guide to generate pixel-perfect UI code in your preferred framework.

## JSON Structure

```json
{
  "v": "1.0",           // Format version
  "name": "Component",  // Component name
  "tokens": { ... },    // Design tokens (colors, fonts, shadows)
  "tree": { ... }       // Component tree
}
```

## Universal Decoding

This format is framework-agnostic. The same JSON can be used to generate:
- React + Tailwind
- React + CSS Modules
- Vue + Scoped CSS
- Svelte
- Vanilla HTML/CSS

The `_meta.keys` field documents all short key mappings:
`t=type, n=name, l=layout, j=justify, al=align, g=gap, r=radius, ...`

## Token Resolution

Tokens are referenced with `$` prefix. Resolve them from the `tokens` section:

```json
{
  "tokens": {
    "colors": { "c0": "#FFFFFF", "c1": "#000000" },
    "fonts": { "f0": "Inter" },
    "shadows": { "s0": "0 4px 6px rgba(0,0,0,0.1)" }
  }
}
```

- `"bg": "$c0"` → `background: #FFFFFF`
- `"f": "$f0"` → `font-family: Inter`
- `"sh": "$s0"` → `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`

## Node Types (`t`) to HTML Elements

| `t` Value | HTML Element | Notes |
|-----------|--------------|-------|
| `frame` | `<div>` | Container with layout |
| `text` | `<span>` or `<p>` | Text content |
| `img` | `<img>` or `<div>` | Image placeholder |
| `rect` | `<div>` | Rectangle shape |
| `ellipse` | `<div>` | Circle/ellipse (use `border-radius: 50%`) |
| `vector` | `<svg>` or icon | Icon placeholder |
| `instance` | Component | Use `componentName` if available |
| `group` | `<div>` | Group container |

## Property Mapping

### Dimensions

| JSON | CSS |
|------|-----|
| `w: 320` | `width: 320px` |
| `w: "fill"` | `width: 100%` or `flex: 1` |
| `w: "hug"` | `width: fit-content` |
| `h: 48` | `height: 48px` |
| `h: "fill"` | `height: 100%` or `flex: 1` |
| `h: "hug"` | `height: fit-content` |
| `minW: 100` | `min-width: 100px` |
| `maxW: 500` | `max-width: 500px` |

### Layout (Flexbox)

| JSON | CSS |
|------|-----|
| `l: "row"` | `display: flex; flex-direction: row` |
| `l: "col"` | `display: flex; flex-direction: column` |
| `g: 16` | `gap: 16px` |
| `wr: true` | `flex-wrap: wrap` |

### Alignment

| JSON | CSS |
|------|-----|
| `j: "start"` | `justify-content: flex-start` |
| `j: "center"` | `justify-content: center` |
| `j: "end"` | `justify-content: flex-end` |
| `j: "between"` | `justify-content: space-between` |
| `al: "start"` | `align-items: flex-start` |
| `al: "center"` | `align-items: center` |
| `al: "end"` | `align-items: flex-end` |
| `al: "stretch"` | `align-items: stretch` |

### Padding

| JSON | CSS |
|------|-----|
| `p: 16` | `padding: 16px` |
| `p: [16, 24, 16, 24]` | `padding: 16px 24px 16px 24px` |

**Padding array order:** `[top, right, bottom, left]`

### Background

| JSON | CSS |
|------|-----|
| `bg: "#FFFFFF"` | `background: #FFFFFF` |
| `bg: "$c0"` | Resolve token, then `background: [resolved-color]` |
| `bg: { type: "linear", ... }` | `background: linear-gradient(...)` |

### Border Radius

| JSON | CSS |
|------|-----|
| `r: 8` | `border-radius: 8px` |
| `r: [8, 8, 0, 0]` | `border-radius: 8px 8px 0 0` |

**Radius array order:** `[top-left, top-right, bottom-right, bottom-left]`

### Border

```json
{ "bd": { "w": 1, "c": "$c1", "style": "solid" } }
```

→ `border: 1px solid [resolved-color]`

### Shadow

| JSON | CSS |
|------|-----|
| `sh: "$s0"` | `box-shadow: [resolved-shadow]` |
| `sh: "0 4px 6px rgba(0,0,0,0.1)"` | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` |

### Opacity

| JSON | CSS |
|------|-----|
| `o: 0.5` | `opacity: 0.5` |
| `o: 0.8` | `opacity: 0.8` |

### Overflow

| JSON | CSS |
|------|-----|
| `of: "hidden"` | `overflow: hidden` |
| `of: "scroll"` | `overflow: auto` |
| `of: "visible"` | (default) |

### Absolute Positioning

```json
{ "ps": "abs", "x": 100, "y": 50 }
```

→ `position: absolute; left: 100px; top: 50px`

## Text Properties

| JSON | CSS |
|------|-----|
| `c: "Hello"` | Text content |
| `f: "$f0"` | `font-family: Inter` |
| `s: 16` | `font-size: 16px` |
| `wt: 400` | `font-weight: 400` |
| `wt: 500` | `font-weight: 500` |
| `wt: 600` | `font-weight: 600` |
| `wt: 700` | `font-weight: 700` |
| `cl: "$c1"` | `color: [resolved-color]` |
| `lh: 24` | `line-height: 24px` |
| `lh: 1.5` | `line-height: 1.5` |
| `ls: -0.02` | `letter-spacing: -0.02em` |
| `ta: "center"` | `text-align: center` |
| `ta: "right"` | `text-align: right` |
| `td: "underline"` | `text-decoration: underline` |
| `td: "line-through"` | `text-decoration: line-through` |
| `tt: "uppercase"` | `text-transform: uppercase` |
| `tr: true` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `tr: 2` | `-webkit-line-clamp: 2; display: -webkit-box` |

## Image Properties

| JSON | CSS |
|------|-----|
| `ft: "cover"` | `object-fit: cover` |
| `ft: "contain"` | `object-fit: contain` |
| `ft: "fill"` | `object-fit: fill` |

## Tailwind Value Mapping

Use standard Tailwind values when possible:

| Pixels | Tailwind |
|--------|----------|
| 4 | `1` |
| 8 | `2` |
| 12 | `3` |
| 16 | `4` |
| 20 | `5` |
| 24 | `6` |
| 32 | `8` |
| 40 | `10` |
| 48 | `12` |
| 64 | `16` |
| 80 | `20` |
| 96 | `24` |

For non-standard values, use arbitrary values: `w-[320px]`, `gap-[18px]`

## Generation Rules

1. **Use your preferred styling** - Tailwind, CSS Modules, styled-components, scoped CSS, etc.
2. **Use semantic HTML** - Choose appropriate elements (`button`, `a`, `h1-h6`)
3. **Preserve hierarchy** - `ch` array represents children in order
4. **Handle images** - Use placeholder for `img` type nodes
5. **Component naming** - Use `n` (name) property for component/variable names
6. **Accessibility** - Add appropriate ARIA attributes, alt text

## Example Transformation

### Input JSON:
```json
{
  "v": "1.0",
  "name": "Button",
  "tokens": {
    "colors": { "c0": "#4F46E5", "c1": "#FFFFFF" },
    "fonts": { "f0": "Inter" }
  },
  "tree": {
    "t": "frame",
    "n": "Button",
    "l": "row",
    "w": "hug",
    "h": 44,
    "p": [0, 24, 0, 24],
    "g": 8,
    "r": 8,
    "bg": "$c0",
    "j": "center",
    "al": "center",
    "ch": [
      {
        "t": "text",
        "c": "Click me",
        "f": "$f0",
        "s": 14,
        "wt": 500,
        "cl": "$c1"
      }
    ]
  }
}
```

## Framework Examples

### React + Tailwind
```tsx
function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-row items-center justify-center gap-2 h-[44px] px-6 rounded-lg bg-[#4F46E5]"
    >
      <span className="font-['Inter'] text-sm font-medium text-white">
        {children ?? 'Click me'}
      </span>
    </button>
  );
}
```

### Vue + Scoped CSS
```vue
<template>
  <button class="button" @click="$emit('click')">
    <span class="label">{{ children ?? 'Click me' }}</span>
  </button>
</template>

<style scoped>
.button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  background: #4F46E5;
}
.label {
  font-family: Inter;
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
}
</style>
```

### Vanilla HTML/CSS
```html
<button style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 24px; border-radius: 8px; background: #4F46E5;">
  <span style="font-family: Inter; font-size: 14px; font-weight: 500; color: #FFFFFF;">Click me</span>
</button>
```

## Notes

- Always resolve token references before generating code
- Use the `n` (name) property for component and variable naming
- Add hover/focus states for interactive elements
- Include TypeScript interfaces for props when using TypeScript
- Make text content configurable via props where appropriate
