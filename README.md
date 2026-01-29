# TagExplorer

A tag-based file system with interactive graph visualization. Explore and organize your files through tags instead of traditional folder hierarchies.

## Features

- **Tag-based organization** — assign tags to files manually or via AI-powered suggestions
- **Graph visualization** — explore relationships between files and tags using an interactive force-directed graph
- **AI analysis** — automatic tag suggestions from file content using Gemini vision
- **File upload & preview** — drag-and-drop upload with in-app file preview

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Convex (database, file storage, serverless functions)
- **AI**: Vercel AI Gateway → Gemini 2.5 Flash Lite (vision)
- **Graph**: react-force-graph-2d
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) API key

### Setup

```bash
npm install
npx convex dev    # in a separate terminal
npm run dev
```

Set your AI Gateway API key in the Convex dashboard as an environment variable.

## Status

This is a proof of concept — single user, no auth, desktop-first.

## License

[MIT](LICENSE)
