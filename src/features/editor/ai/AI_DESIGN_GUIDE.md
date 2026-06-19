# Builder Thinking AI Design Guide

Use this guide to generate a complete Builder Thinking design token that can be imported by the web editor.

## Intake and confirmation first

Do not generate the design JSON immediately from a short or unclear user request.

Before designing, check whether the user has provided enough content and intent to choose an appropriate layout. If important information is missing, ask concise questions first. Do not output a project token until the user confirms the brief.

Minimum information to confirm:

- Design type: CV, resume, poster, flyer, presentation, social post, portfolio, certificate, menu, invoice, or another format.
- Target audience and purpose.
- Page size or platform when relevant, such as A4, square social post, story, slide, or custom dimensions.
- Required text content, including names, titles, sections, contact details, product details, dates, prices, or calls to action.
- Visual direction, such as modern, premium, playful, corporate, minimal, editorial, colorful, or monochrome.
- Brand inputs when available, including logo, colors, fonts, images, and existing style references.
- Number of pages and what each page should contain.

If the user provides partial content, summarize the inferred brief and ask for confirmation before generating JSON. Example:

```text
I can build this as a one-page modern CV. I have the name, role, experience, and skills, but I still need contact details, education, and preferred style. Should I use an A4 layout with a left sidebar and clean corporate colors?
```

Only proceed to the JSON output after the user confirms or explicitly asks you to continue with reasonable assumptions. When assumptions are used, keep them minimal and layout-focused.

## Required output

After the intake is confirmed, return a complete `.json` file containing only one JSON object. Do not wrap it in Markdown.

The output must be directly copyable into Builder Thinking's `Import -> Import JSON Token` dialog and also valid when saved as a `.json` file.

If the AI interface supports file creation or downloadable attachments, create a JSON file for the user to download. Use a descriptive kebab-case filename ending in `.json`, such as `coffee-instagram-poster.json` or `modern-cv-token.json`. The file content must be the exact project token JSON object, with no Markdown, comments, or extra wrapper text.

## Editor import contract

Builder Thinking has two import paths:

- `Import project file` loads an encrypted `.btproj` file exported by the editor.
- `Import JSON Token` loads a plain JSON token pasted by the user or dropped as a `.json` file.

AI should generate the plain `.json` token file format only. Do not try to generate the encrypted `.btproj` wrapper with `type`, `algorithm`, `iv`, and `data`.

The expected AI output is the same project payload shape used by the editor after import normalization:

```json
{
  "schema": "builder-thinking.project",
  "version": 1,
  "activePageId": "page-1",
  "pages": [
    {
      "id": "page-1",
      "name": "Page 1",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```

Field rules:

- `schema` must be `"builder-thinking.project"`.
- `version` must be `1`.
- `activePageId` must match one of the page ids in `pages`.
- `pages` must be a non-empty array.
- Every page `id` must be stable and unique, such as `page-1`, `page-2`, `page-3`.
- Every page `name` should be short and human-readable.
- Every page `serialized` must be a JSON string containing the CraftJS serialized node map for that page.
- Every serialized node map must contain `ROOT`.
- `ROOT.type.resolvedName` must be `"CanvasRoot"`.
- Component node `type.resolvedName` values should use supported editor components such as `Section`, `TextBlock`, `ImageBlock`, `ShapeBlock`, and `SvgIconBlock`.
- Do not output a raw single-page CraftJS object as the final answer, even though the importer can normalize it. Always output the full project token shape above.

Do not output:

- Markdown code fences
- Explanations before or after the JSON
- Comments
- Trailing commas
- JavaScript object syntax
- Unescaped line breaks inside strings

Output valid JSON only.

If the design has multiple pages, put all pages in the same JSON token. Do not output separate files or separate JSON blocks.

The editor accepts this canonical project token shape:

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
      serialized: JSON.stringify(pageOneCraftNodes),
    },
    {
      id: "page-2",
      name: "Details",
      serialized: JSON.stringify(pageTwoCraftNodes),
    },
  ],
};

return JSON.stringify(projectToken, null, 2);
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
    "nodes": [
      "sidebar-section",
      "avatar-shape",
      "contact-title",
      "contact-text"
    ]
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
    "nodes": [
      "avatar-shape",
      "contact-title",
      "contact-text",
      "profile-title",
      "profile-text"
    ]
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

### Image fill and crop rules

Sections and closed shapes can use an image as their fill.

Use these image sizing values:

- `"cover"`: crop the image to fully cover the frame.
- `"contain"`: show the full image inside the frame.
- `"100% 100%"`: fill/stretch the image to the frame size.
- `"auto"`: render the image at its original size.

For crop-like behavior, use `"cover"` and control the visible crop area with percentage position props:

```json
{
  "backgroundFill": "image",
  "backgroundImage": "data:image/png;base64,...",
  "backgroundSize": "cover",
  "backgroundPosition": "50% 50%",
  "backgroundPositionX": 50,
  "backgroundPositionY": 50
}
```

`backgroundPositionX` and `backgroundPositionY` are percentages from `0` to `100`. Center crop is `50, 50`. Top-left crop is `0, 0`. Bottom-right crop is `100, 100`.

For shapes, use the equivalent `imagePositionX` and `imagePositionY` props. The editor lets users adjust crop by holding Shift and dragging the image inside the selected frame when the image size is `cover` or `auto`. Do not describe crop dragging for `contain`, because `contain` shows the whole image.

## Components

### Section

Use sections for frames, cards, panels, containers, backgrounds, and nested layout.

```json
{
  "background": "#f8fafc",
  "backgroundFill": "color",
  "backgroundImage": "",
  "backgroundPosition": "center",
  "backgroundPositionX": 50,
  "backgroundPositionY": 50,
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
  "fillType": "color",
  "fill": "#38bdf8",
  "opacity": 100,
  "strokeColor": "#0284c7",
  "strokeWidth": 0,
  "strokeStyle": "solid",
  "lineDirection": "up",
  "points": "50,4 96,96 4,96",
  "imageSrc": "",
  "imagePosition": "center",
  "imagePositionX": 50,
  "imagePositionY": 50,
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

For closed shapes with image fill, set:

```json
{
  "shapeType": "ellipse",
  "fillType": "image",
  "fill": "#ffffff",
  "imageSrc": "data:image/png;base64,...",
  "imageSize": "cover",
  "imagePosition": "50% 50%",
  "imagePositionX": 50,
  "imagePositionY": 50
}
```

This works for `rectangle`, `ellipse`, `polygon`, and `image`. It does not apply to `line`, because lines are open shapes.

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
      "name": "CV",
      "serialized": "{\"ROOT\":{\"type\":{\"resolvedName\":\"CanvasRoot\"},\"isCanvas\":true,\"props\":{\"pageSizePreset\":\"a4\",\"width\":860,\"height\":1040,\"background\":\"#ffffff\",\"layoutMode\":\"free\"},\"displayName\":\"Page\",\"custom\":{},\"hidden\":false,\"nodes\":[\"sidebar\",\"main\"],\"linkedNodes\":{}},\"sidebar\":{\"type\":{\"resolvedName\":\"Section\"},\"isCanvas\":true,\"props\":{\"background\":\"#1f2937\",\"layout\":\"fixed\",\"layoutMode\":\"free\",\"x\":0,\"y\":0,\"width\":260,\"height\":1040},\"displayName\":\"Sidebar\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[\"nameSidebar\",\"contactTitle\",\"contactInfo\",\"skillsTitle\",\"skillsInfo\"],\"linkedNodes\":{}},\"nameSidebar\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"NGUYEN VAN A\",\"fontFamily\":\"Inter\",\"fontSize\":28,\"fontWeight\":700,\"lineHeight\":34,\"color\":\"#ffffff\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":20,\"y\":50,\"width\":220,\"height\":40},\"displayName\":\"Name\",\"custom\":{},\"parent\":\"sidebar\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"contactTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"CONTACT\",\"fontFamily\":\"Inter\",\"fontSize\":18,\"fontWeight\":700,\"lineHeight\":24,\"color\":\"#ffffff\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":20,\"y\":140,\"width\":200,\"height\":30},\"displayName\":\"ContactTitle\",\"custom\":{},\"parent\":\"sidebar\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"contactInfo\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"📧 nguyenvana@gmail.com\\n📱 0901234567\\n📍 Ho Chi Minh City\",\"fontFamily\":\"Inter\",\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":24,\"color\":\"#e5e7eb\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":20,\"y\":180,\"width\":220,\"height\":100},\"displayName\":\"ContactInfo\",\"custom\":{},\"parent\":\"sidebar\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"skillsTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"SKILLS\",\"fontFamily\":\"Inter\",\"fontSize\":18,\"fontWeight\":700,\"lineHeight\":24,\"color\":\"#ffffff\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":20,\"y\":320,\"width\":200,\"height\":30},\"displayName\":\"SkillsTitle\",\"custom\":{},\"parent\":\"sidebar\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"skillsInfo\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"• React.js\\n• Next.js\\n• TypeScript\\n• Tailwind CSS\\n• Node.js\\n• Git\",\"fontFamily\":\"Inter\",\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":24,\"color\":\"#e5e7eb\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":20,\"y\":360,\"width\":220,\"height\":180},\"displayName\":\"SkillsInfo\",\"custom\":{},\"parent\":\"sidebar\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"main\":{\"type\":{\"resolvedName\":\"Section\"},\"isCanvas\":true,\"props\":{\"background\":\"#ffffff\",\"layout\":\"fixed\",\"layoutMode\":\"free\",\"x\":260,\"y\":0,\"width\":600,\"height\":1040},\"displayName\":\"MainContent\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[\"jobTitle\",\"summaryTitle\",\"summaryText\",\"expTitle\",\"exp1\",\"eduTitle\",\"edu1\"],\"linkedNodes\":{}},\"jobTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"Frontend Developer\",\"fontFamily\":\"Inter\",\"fontSize\":32,\"fontWeight\":700,\"lineHeight\":40,\"color\":\"#111827\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":50,\"width\":400,\"height\":50},\"displayName\":\"JobTitle\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"summaryTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"PROFILE\",\"fontFamily\":\"Inter\",\"fontSize\":20,\"fontWeight\":700,\"lineHeight\":28,\"color\":\"#111827\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":130,\"width\":200,\"height\":30},\"displayName\":\"SummaryTitle\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"summaryText\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"Frontend Developer with 3+ years of experience building modern web applications using React.js, Next.js and TypeScript.\",\"fontFamily\":\"Inter\",\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":24,\"color\":\"#374151\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":170,\"width\":500,\"height\":100},\"displayName\":\"SummaryText\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"expTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"EXPERIENCE\",\"fontFamily\":\"Inter\",\"fontSize\":20,\"fontWeight\":700,\"lineHeight\":28,\"color\":\"#111827\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":300,\"width\":200,\"height\":30},\"displayName\":\"ExpTitle\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"exp1\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"ABC Technology | Frontend Developer\\n2023 - Present\\n• Developed React.js applications\\n• Improved page performance by 35%\",\"fontFamily\":\"Inter\",\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":24,\"color\":\"#374151\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":340,\"width\":500,\"height\":120},\"displayName\":\"Experience1\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"eduTitle\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"EDUCATION\",\"fontFamily\":\"Inter\",\"fontSize\":20,\"fontWeight\":700,\"lineHeight\":28,\"color\":\"#111827\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":500,\"width\":200,\"height\":30},\"displayName\":\"EduTitle\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"edu1\":{\"type\":{\"resolvedName\":\"TextBlock\"},\"isCanvas\":false,\"props\":{\"text\":\"University of Information Technology\\nBachelor of Software Engineering\\n2017 - 2021\",\"fontFamily\":\"Inter\",\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":24,\"color\":\"#374151\",\"textSizing\":\"autoHeight\",\"layout\":\"fixed\",\"x\":40,\"y\":540,\"width\":500,\"height\":100},\"displayName\":\"Education1\",\"custom\":{},\"parent\":\"main\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}"
    }
  ]
}
```
