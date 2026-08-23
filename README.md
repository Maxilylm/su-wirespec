# WireSpec

> Upload a wireframe or sketch and get back a written product specification.

**[Live demo](https://su-wirespec.vercel.app)**

Turning a whiteboard photo into something a developer can build usually means someone sits down and writes the spec by hand. WireSpec accepts an image of a wireframe or sketch, downscales it in the browser before upload, and passes it to Groq's Llama 4 Scout vision model. What comes back is structured: an overview, an inventory of UI components and their interactions, a step-by-step user flow, technical and accessibility notes, and a complexity rating you can export straight to Markdown.

## Features

- Drag-and-drop or file-picker upload with image-type checking and a 4MB limit
- Client-side downscaling to 1024px and JPEG re-encoding before the image is sent
- Component inventory listing each element's type, description, and interactions
- Ordered user flow plus separate technical and accessibility note sections
- Low / Medium / High complexity estimate
- Export the entire spec to the clipboard as formatted Markdown

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` for image understanding

## Running locally

```bash
npm install
npm run dev
```

Set `GROQ_API_KEY` in `.env.local`.

---

Part of a series of 91 small web apps. [Browse them all](https://su-slopmachine.vercel.app).
