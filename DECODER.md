# Figma JSON Decoder for AI

When the user provides a JSON export from the "Figma to AI JSON" plugin, use this guide to generate pixel-perfect React/Tailwind code.

## JSON Structure

```json
{
  "v": "1.0",           // Format version
  "name": "Component",  // Component name
  "tokens": { ... },    // Design tokens (colors, fonts, shadows)
  "tree": { ... }       // Component tree
}
```

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

- `"bg": "$c0"` → `background: #FFFFFF` → `bg-[#FFFFFF]`
- `"font": "$f0"` → `font-family: Inter` → `font-['Inter']`
- `"shadow": "$s0"` → `box-shadow: ...` → `shadow-[0_4px_6px_rgba(0,0,0,0.1)]`

## Node Types → React Elements

| Type | React Element | Notes |
|------|---------------|-------|
| `frame` | `<div>` | Container with layout |
| `text` | `<span>` or `<p>` | Text content |
| `img` | `<img>` or `<div>` | Image placeholder |
| `rect` | `<div>` | Rectangle shape |
| `ellipse` | `<div>` | Circle/ellipse (use `rounded-full`) |
| `vector` | `<svg>` or icon | Icon placeholder |
| `instance` | Component | Use `componentName` if available |
| `group` | `<div>` | Group container |

## Property Mapping

### Dimensions

| JSON | Tailwind | CSS |
|------|----------|-----|
| `w: 320` | `w-[320px]` | `width: 320px` |
| `w: "fill"` | `w-full` or `flex-1` | `width: 100%` |
| `w: "hug"` | `w-fit` | `width: fit-content` |
| `h: 48` | `h-[48px]` | `height: 48px` |
| `h: "fill"` | `h-full` or `flex-1` | `height: 100%` |
| `h: "hug"` | `h-fit` | `height: fit-content` |
| `minW: 100` | `min-w-[100px]` | `min-width: 100px` |
| `maxW: 500` | `max-w-[500px]` | `max-width: 500px` |

### Layout (Flexbox)

| JSON | Tailwind | CSS |
|------|----------|-----|
| `layout: "row"` | `flex flex-row` | `display: flex; flex-direction: row` |
| `layout: "col"` | `flex flex-col` | `display: flex; flex-direction: column` |
| `gap: 16` | `gap-4` | `gap: 16px` |
| `wrap: true` | `flex-wrap` | `flex-wrap: wrap` |

### Alignment

| JSON | Tailwind | CSS |
|------|----------|-----|
| `justify: "start"` | `justify-start` | `justify-content: flex-start` |
| `justify: "center"` | `justify-center` | `justify-content: center` |
| `justify: "end"` | `justify-end` | `justify-content: flex-end` |
| `justify: "between"` | `justify-between` | `justify-content: space-between` |
| `align: "start"` | `items-start` | `align-items: flex-start` |
| `align: "center"` | `items-center` | `align-items: center` |
| `align: "end"` | `items-end` | `align-items: flex-end` |
| `align: "stretch"` | `items-stretch` | `align-items: stretch` |

### Padding

| JSON | Tailwind | CSS |
|------|----------|-----|
| `p: 16` | `p-4` | `padding: 16px` |
| `p: [16, 24, 16, 24]` | `pt-4 pr-6 pb-4 pl-6` or `py-4 px-6` | `padding: 16px 24px` |

**Padding array order:** `[top, right, bottom, left]`

### Background

| JSON | Tailwind |
|------|----------|
| `bg: "#FFFFFF"` | `bg-[#FFFFFF]` |
| `bg: "$c0"` | Resolve token, then `bg-[resolved-color]` |
| `bg: { type: "linear", ... }` | Use `bg-gradient-to-*` or inline style |

### Border Radius

| JSON | Tailwind | CSS |
|------|----------|-----|
| `radius: 8` | `rounded-lg` or `rounded-[8px]` | `border-radius: 8px` |
| `radius: [8, 8, 0, 0]` | `rounded-t-lg` or `rounded-tl-[8px] rounded-tr-[8px]` | Individual corners |

**Radius array order:** `[top-left, top-right, bottom-right, bottom-left]`

### Border

```json
{ "border": { "w": 1, "c": "$c1", "style": "solid" } }
```

→ `border border-[#resolved-color]` or `border-[1px] border-solid border-[color]`

### Shadow

| JSON | Tailwind |
|------|----------|
| `shadow: "$s0"` | `shadow-[resolved-shadow]` |
| `shadow: "0 4px 6px rgba(0,0,0,0.1)"` | `shadow-[0_4px_6px_rgba(0,0,0,0.1)]` |

### Opacity

| JSON | Tailwind |
|------|----------|
| `opacity: 0.5` | `opacity-50` |
| `opacity: 0.8` | `opacity-80` |

### Overflow

| JSON | Tailwind |
|------|----------|
| `overflow: "hidden"` | `overflow-hidden` |
| `overflow: "scroll"` | `overflow-auto` |
| `overflow: "visible"` | (default, no class needed) |

### Absolute Positioning

```json
{ "pos": "abs", "x": 100, "y": 50 }
```

→ `absolute left-[100px] top-[50px]`

## Text Properties

| JSON | Tailwind |
|------|----------|
| `content: "Hello"` | Text content |
| `font: "$f0"` | `font-['Inter']` |
| `size: 16` | `text-base` or `text-[16px]` |
| `weight: 400` | `font-normal` |
| `weight: 500` | `font-medium` |
| `weight: 600` | `font-semibold` |
| `weight: 700` | `font-bold` |
| `color: "$c1"` | `text-[#resolved-color]` |
| `lineH: 24` | `leading-[24px]` |
| `lineH: 1.5` | `leading-normal` or `leading-[1.5]` |
| `letterS: -0.02` | `tracking-tight` or `tracking-[-0.02em]` |
| `textAlign: "center"` | `text-center` |
| `textAlign: "right"` | `text-right` |
| `textDecor: "underline"` | `underline` |
| `textDecor: "line-through"` | `line-through` |
| `textTransform: "uppercase"` | `uppercase` |
| `truncate: true` | `truncate` |
| `truncate: 2` | `line-clamp-2` |

## Image Properties

| JSON | Tailwind |
|------|----------|
| `fit: "cover"` | `object-cover` |
| `fit: "contain"` | `object-contain` |
| `fit: "fill"` | `object-fill` |

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

1. **Always use Tailwind classes** - Prefer Tailwind over inline styles
2. **Use semantic HTML** - Choose appropriate elements (`button`, `a`, `h1-h6`)
3. **Preserve hierarchy** - `ch` array represents children in order
4. **Handle images** - Use placeholder for `img` type nodes
5. **Component naming** - Use `name` property for component/variable names
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
    "type": "frame",
    "name": "Button",
    "layout": "row",
    "w": "hug",
    "h": 44,
    "p": [0, 24, 0, 24],
    "gap": 8,
    "radius": 8,
    "bg": "$c0",
    "justify": "center",
    "align": "center",
    "ch": [
      {
        "type": "text",
        "content": "Click me",
        "font": "$f0",
        "size": 14,
        "weight": 500,
        "color": "$c1"
      }
    ]
  }
}
```

### Output React/Tailwind:
```tsx
interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-row items-center justify-center gap-2 h-[44px] px-6 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] transition-colors"
    >
      <span className="font-['Inter'] text-sm font-medium text-white">
        {children ?? 'Click me'}
      </span>
    </button>
  );
}

export default Button;
```

## Notes

- Always resolve token references before generating code
- Use the `name` property for component and variable naming
- Add hover/focus states for interactive elements
- Include TypeScript interfaces for props
- Make text content configurable via props where appropriate
