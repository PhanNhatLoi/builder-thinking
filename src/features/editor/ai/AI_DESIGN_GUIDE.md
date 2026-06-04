# Builder Thinking AI Design Guide

Use this guide to generate a complete Builder Thinking design token that can be imported by the web editor.

## Required output

Return only a JSON object. Do not wrap it in Markdown.

The output must be directly copyable into Builder Thinking's `Import -> Import JSON Token` dialog.

Do not output:

- Markdown code fences
- Explanations before or after the JSON
- Comments
- Trailing commas
- JavaScript object syntax
- Unescaped line breaks inside strings

Output valid JSON only.

If the design has multiple pages, put all pages in the same JSON token. Do not output separate files or separate JSON blocks.

The editor accepts this project token shape:

```json
{
  "schema": "builder-thinking.project",
  "version": 1,
  "activePageId": "page-1",
  "pages": [
    {
      "id": "page-1",
      "name": "Cover",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```

`serialized` must be a JSON string of CraftJS serialized nodes. Every page must have one `ROOT` node.

## Multi-page output

A complete design can contain any number of pages in one JSON token. Use one item in the `pages` array for each page.

Example structure:

```json
{
  "schema": "builder-thinking.project",
  "version": 1,
  "activePageId": "page-1",
  "pages": [
    {
      "id": "page-1",
      "name": "Cover",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    },
    {
      "id": "page-2",
      "name": "Details",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```

Use stable page ids such as `page-1`, `page-2`, `page-3`. Set `activePageId` to the page that should open first after import.

## Copy-safe JSON rules

This is the most important rule for AI output.

Each page's `serialized` value must be a JSON-escaped string, not a nested object.

Correct:

```json
{
  "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
}
```

Incorrect:

```json
{
  "serialized": {
    "ROOT": {
      "type": { "resolvedName": "CanvasRoot" }
    }
  }
}
```

Before returning the final answer, validate that:

- The whole response is parseable by `JSON.parse(responseText)`.
- Every `pages[index].serialized` is a string.
- Every `pages[index].serialized` can also be parsed by `JSON.parse(pages[index].serialized)`.
- Every serialized page contains a `ROOT` node.
- Every non-root node id appears in its parent's `nodes` array.

## Recommended AI workflow

1. Build each page as a normal CraftJS serialized object.
2. Convert each page object to a string with `JSON.stringify(pageObject)`.
3. Put that string into the page's `serialized` field.
4. Build the final project token.
5. Return only the final project token JSON.

Pseudo-code:

```js
const projectToken = {
  schema: "builder-thinking.project",
  version: 1,
  activePageId: "page-1",
  pages: [
    {
      id: "page-1",
      name: "Cover",
      serialized: JSON.stringify(pageOneCraftNodes)
    },
    {
      id: "page-2",
      name: "Details",
      serialized: JSON.stringify(pageTwoCraftNodes)
    }
  ]
}

return JSON.stringify(projectToken, null, 2)
```

## Page root

Use `CanvasRoot` for `ROOT`.

Common props:

```json
{
  "pageSizePreset": "a4",
  "width": 860,
  "height": 1040,
  "background": "#ffffff",
  "opacity": 100,
  "paddingTop": 44,
  "paddingRight": 44,
  "paddingBottom": 44,
  "paddingLeft": 44,
  "gapX": 18,
  "gapY": 18,
  "layoutMode": "free",
  "alignItems": "stretch",
  "justifyContent": "start",
  "wrap": false,
  "gridRows": 2,
  "gridColumns": 2,
  "gridFlow": "row",
  "clipContent": false,
  "borderWidth": 1,
  "borderColor": "#d8dee8",
  "borderStyle": "solid"
}
```

Supported `layoutMode`: `free`, `horizontal`, `vertical`, `grid`.

## Node format

Every non-root node follows this shape:

```json
{
  "type": { "resolvedName": "Section" },
  "isCanvas": true,
  "props": {},
  "displayName": "Section",
  "custom": {},
  "parent": "ROOT",
  "hidden": false,
  "nodes": [],
  "linkedNodes": {}
}
```

In free layout, use fixed positioning:

```json
{
  "layout": "fixed",
  "x": 80,
  "y": 80,
  "width": 300,
  "height": 160
}
```

In auto layout, use flow positioning:

```json
{
  "layout": "flow",
  "width": 300,
  "height": 160
}
```

## Layer and container rules

Think like Figma/Canva layers.

If a visible block acts as a background, panel, sidebar, card, hero area, avatar frame, contact column, content column, or grouped visual region, create a `Section` for that block and put its internal elements inside that section.

Do not place every visual element directly under `ROOT` unless they are truly independent top-level elements.

### Parent-child rule

Every child inside a section must satisfy both conditions:

- The child node's `parent` equals the section id.
- The section node's `nodes` array contains the child id.

Correct:

```json
{
  "ROOT": {
    "type": { "resolvedName": "CanvasRoot" },
    "isCanvas": true,
    "props": { "layoutMode": "free" },
    "displayName": "Page",
    "custom": {},
    "hidden": false,
    "nodes": ["sidebar-section"],
    "linkedNodes": {}
  },
  "sidebar-section": {
    "type": { "resolvedName": "Section" },
    "isCanvas": true,
    "props": {
      "background": "#284a7d",
      "layoutMode": "free",
      "layout": "fixed",
      "x": 40,
      "y": 40,
      "width": 260,
      "height": 920
    },
    "displayName": "Sidebar",
    "custom": {},
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["avatar-shape", "contact-title", "contact-text"],
    "linkedNodes": {}
  },
  "avatar-shape": {
    "type": { "resolvedName": "ShapeBlock" },
    "isCanvas": false,
    "props": {
      "shapeType": "ellipse",
      "fill": "#d9b38f",
      "layout": "fixed",
      "x": 40,
      "y": 40,
      "width": 160,
      "height": 160
    },
    "displayName": "Avatar",
    "custom": {},
    "parent": "sidebar-section",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "contact-title": {
    "type": { "resolvedName": "TextBlock" },
    "isCanvas": false,
    "props": {
      "text": "CONTACT",
      "fontSize": 22,
      "fontWeight": 700,
      "color": "#ffffff",
      "textSizing": "autoHeight",
      "layout": "fixed",
      "x": 32,
      "y": 260,
      "width": 190,
      "height": 32
    },
    "displayName": "Contact Title",
    "custom": {},
    "parent": "sidebar-section",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "contact-text": {
    "type": { "resolvedName": "TextBlock" },
    "isCanvas": false,
    "props": {
      "text": "Ho Chi Minh City\n0901 234 567\nnguyenvana@gmail.com",
      "fontSize": 14,
      "fontWeight": 400,
      "lineHeight": 22,
      "color": "#ffffff",
      "textSizing": "autoHeight",
      "layout": "fixed",
      "x": 32,
      "y": 304,
      "width": 200,
      "height": 74
    },
    "displayName": "Contact Details",
    "custom": {},
    "parent": "sidebar-section",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  }
}
```

Incorrect:

```json
{
  "ROOT": {
    "nodes": ["sidebar-section", "avatar-shape", "contact-title", "contact-text"]
  },
  "sidebar-section": {
    "parent": "ROOT",
    "nodes": []
  },
  "avatar-shape": {
    "parent": "ROOT"
  },
  "contact-title": {
    "parent": "ROOT"
  },
  "contact-text": {
    "parent": "ROOT"
  }
}
```

The incorrect version visually overlaps the elements on top of the sidebar, but the layer structure is wrong. Moving or resizing the sidebar will not move its internal content.

### Coordinate rule for nested sections

Child coordinates are relative to their parent section, not to the page root.

If a sidebar section is at `x: 40`, `y: 40`, and an avatar appears 40px from the sidebar's left edge and 40px from its top edge, the avatar should use:

```json
{
  "parent": "sidebar-section",
  "props": {
    "x": 40,
    "y": 40
  }
}
```

Do not add the parent's offset into the child position.

### Layer order rule

Layer order is controlled by each parent's `nodes` array.

- Earlier ids are lower/back layers.
- Later ids are higher/front layers.
- Background sections should usually appear before text/icons inside the same parent.
- A section's children should be listed inside that section, not beside it in `ROOT`.

Example:

```json
{
  "ROOT": {
    "nodes": ["background-shape", "sidebar-section", "main-content-section"]
  },
  "sidebar-section": {
    "nodes": ["avatar-shape", "contact-title", "contact-text", "profile-title", "profile-text"]
  }
}
```

### When to create a Section

Create a section when elements should move together, resize together, or conceptually belong to one block.

Common examples:

- CV sidebar with avatar, contact, profile, education.
- Resume main column with name, title, experience, skills.
- Product card with image, title, price, and CTA.
- Social post background panel with headline, badge, and decorative shapes.
- Hero section with image background and text overlay.
- Any visible rectangle/panel that has multiple internal children.

Use `layoutMode: "free"` for visual compositions with exact placement. Use `vertical`, `horizontal`, or `grid` only when children should reflow automatically.

## Components

### Section

Use sections for frames, cards, panels, containers, backgrounds, and nested layout.

```json
{
  "background": "#f8fafc",
  "backgroundFill": "color",
  "backgroundImage": "",
  "backgroundPosition": "center",
  "backgroundRepeat": "no-repeat",
  "backgroundSize": "cover",
  "opacity": 100,
  "paddingTop": 0,
  "paddingRight": 0,
  "paddingBottom": 0,
  "paddingLeft": 0,
  "gapX": 16,
  "gapY": 16,
  "radius": 0,
  "layoutMode": "free",
  "alignItems": "stretch",
  "justifyContent": "start",
  "wrap": false,
  "gridRows": 2,
  "gridColumns": 2,
  "gridFlow": "row",
  "clipContent": false,
  "borderWidth": 0,
  "borderColor": "#dbeafe",
  "borderStyle": "solid"
}
```

### TextBlock

Use text blocks for headings, labels, body text, and captions.

```json
{
  "text": "New text",
  "richText": null,
  "fontFamily": "Inter",
  "fontSize": 24,
  "fontWeight": 500,
  "lineHeight": 32,
  "letterSpacing": 0,
  "color": "#111827",
  "align": "left",
  "verticalAlign": "top",
  "opacity": 100,
  "textSizing": "autoHeight",
  "layout": "fixed",
  "x": 80,
  "y": 80,
  "width": 240,
  "height": 40
}
```

Available font families: `Inter`, `Roboto`, `Poppins`, `Montserrat`, `Raleway`, `Oswald`, `Bebas Neue`, `Playfair Display`, `Merriweather`, `Lora`, `Pacifico`, `Dancing Script`.

Text sizing modes:

- `free`: width and height are both manual. Text wraps inside the fixed box and may be clipped if the box is too small.
- `autoHeight`: width is manual, height follows wrapped content automatically. Use this for Canva/Figma-like text boxes.

Do not rely on automatic font-size shrinking. Font size stays exactly as declared in `fontSize`.

### ShapeBlock

Use shapes for rectangles, ellipses, polygons, lines, and image frames.

```json
{
  "shapeType": "rectangle",
  "fill": "#38bdf8",
  "opacity": 100,
  "strokeColor": "#0284c7",
  "strokeWidth": 0,
  "strokeStyle": "solid",
  "lineDirection": "up",
  "points": "50,4 96,96 4,96",
  "imageSrc": "",
  "imagePosition": "center",
  "imageRepeat": "no-repeat",
  "imageSize": "cover",
  "radius": 0,
  "layout": "fixed",
  "x": 80,
  "y": 80,
  "width": 180,
  "height": 120
}
```

Supported `shapeType`: `rectangle`, `ellipse`, `polygon`, `line`, `image`.

For transparent fill, use `"fill": "transparent"`.

### SvgIconBlock

Use icons for simple vector symbols.

```json
{
  "assetId": "home",
  "color": "#111827",
  "opacity": 100,
  "strokeWidth": 2,
  "layout": "fixed",
  "x": 80,
  "y": 80,
  "width": 72,
  "height": 72
}
```

Common asset ids include `home`, `phone`, `mail`, `user`, `briefcase`, `calendar`, `map-pin`, `star`, `heart`, `check`, `arrow-right`, `globe`.

### ImageBlock

Use `ImageBlock` for normal images. For uploaded/local images, use a data URL in `src`.

```json
{
  "src": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
  "width": 690,
  "height": 220,
  "radius": 18,
  "layout": "fixed",
  "x": 80,
  "y": 220
}
```

## Good design rules

- Prefer `layoutMode: "free"` for poster, CV, social, and Canva-like absolute composition.
- Use sections as grouped frames and backgrounds.
- Keep every child id unique.
- Add child ids to the parent node `nodes` array in the desired layer order.
- Set `parent` correctly for every non-root node.
- Keep page bounds in mind. For A4, use `width: 860`, `height: 1040`.
- Do not output comments or Markdown around the JSON token.

## Minimal page example

```json
{
  "schema": "builder-thinking.project",
  "version": 1,
  "activePageId": "page-1",
  "pages": [
    {
      "id": "page-1",
      "name": "Poster",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{\"pageSizePreset\":\"a4\",\"width\":860,\"height\":1040,\"background\":\"#ffffff\",\"opacity\":100,\"paddingTop\":44,\"paddingRight\":44,\"paddingBottom\":44,\"paddingLeft\":44,\"gapX\":18,\"gapY\":18,\"layoutMode\":\"free\",\"alignItems\":\"stretch\",\"justifyContent\":\"start\",\"wrap\":false,\"gridRows\":2,\"gridColumns\":2,\"gridFlow\":\"row\",\"clipContent\":false,\"borderWidth\":1,\"borderColor\":\"#d8dee8\",\"borderStyle\":\"solid\"},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[\"title-1\"],\"linkedNodes\":{}},\"title-1\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"AI Generated Design\",\"richText\":null,\"fontFamily\":\"Inter\",\"fontSize\":48,\"fontWeight\":700,\"lineHeight\":58,\"letterSpacing\":0,\"color\":\"#111827\",\"align\":\"left\",\"verticalAlign\":\"top\",\"opacity\":100,\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":96,\"y\":96,\"width\":560,\"height\":70},\"displayName\":\"Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```
