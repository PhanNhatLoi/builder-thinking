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
  "layout": "fixed",
  "x": 80,
  "y": 80,
  "width": 240,
  "height": 40
}
```

Available font families: `Inter`, `Roboto`, `Poppins`, `Montserrat`, `Raleway`, `Oswald`, `Bebas Neue`, `Playfair Display`, `Merriweather`, `Lora`, `Pacifico`, `Dancing Script`.

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
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{\"pageSizePreset\":\"a4\",\"width\":860,\"height\":1040,\"background\":\"#ffffff\",\"opacity\":100,\"paddingTop\":44,\"paddingRight\":44,\"paddingBottom\":44,\"paddingLeft\":44,\"gapX\":18,\"gapY\":18,\"layoutMode\":\"free\",\"alignItems\":\"stretch\",\"justifyContent\":\"start\",\"wrap\":false,\"gridRows\":2,\"gridColumns\":2,\"gridFlow\":\"row\",\"clipContent\":false,\"borderWidth\":1,\"borderColor\":\"#d8dee8\",\"borderStyle\":\"solid\"},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[\"title-1\"],\"linkedNodes\":{}},\"title-1\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"AI Generated Design\",\"richText\":null,\"fontFamily\":\"Inter\",\"fontSize\":48,\"fontWeight\":700,\"lineHeight\":58,\"letterSpacing\":0,\"color\":\"#111827\",\"align\":\"left\",\"verticalAlign\":\"top\",\"opacity\":100,\"layout\":\"fixed\",\"x\":96,\"y\":96,\"width\":560,\"height\":70},\"displayName\":\"Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```
