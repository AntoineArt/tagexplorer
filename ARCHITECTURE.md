# TagExplorer - Architecture Technique

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
├─────────────────┬───────────────────────────────────────────────┤
│  UploadSidebar  │              GraphView                        │
│  - Drag & drop  │              - react-force-graph-2d           │
│  - Tag editor   │              - Noeuds fichiers + tags         │
│  - Validation   │              - Temps réel via useQuery        │
├─────────────────┴───────────────────────────────────────────────┤
│                      Convex React Client                         │
│                      (WebSocket realtime)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Convex Backend                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    Mutations    │     Queries     │         Actions             │
│  - saveFile     │  - listFiles    │  - analyzeFile              │
│  - createTag    │  - listTags     │    (appel OpenAI)           │
│  - linkFileTag  │  - getFileUrl   │                             │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                         Convex Storage                           │
│                    (fichiers images/PDFs)                        │
├─────────────────────────────────────────────────────────────────┤
│                         Convex Database                          │
│                   Tables: files, tags, fileTags                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel AI Gateway                           │
│                   openai/gpt-5-nano (vision)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Principal : Upload & Analyse

```
1. User drag & drop file
         │
         ▼
2. generateUploadUrl() ──────────► Convex mutation
         │                              │
         ▼                              ▼
3. POST file to URL ◄──────────── Upload URL
         │
         ▼
4. Receive storageId
         │
         ▼
5. analyzeFile(storageId) ───────► Convex action
         │                              │
         │                              ▼
         │                         Fetch file from storage
         │                              │
         │                              ▼
         │                         Convert to base64
         │                              │
         │                              ▼
         │                         Call OpenAI API
         │                              │
         ▼                              ▼
6. Display suggested tags ◄────── Return tags array
         │
         ▼
7. User validates tags
         │
         ▼
8. saveFile() + createTags() + linkFileTags()
         │
         ▼
9. GraphView updates (realtime via useQuery)
```

## Schema Convex

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.string(),           // MIME type
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }),

  tags: defineTable({
    name: v.string(),           // lowercase, unique
    color: v.optional(v.string()),
  }).index("by_name", ["name"]),

  fileTags: defineTable({
    fileId: v.id("files"),
    tagId: v.id("tags"),
  })
    .index("by_file", ["fileId"])
    .index("by_tag", ["tagId"]),
});
```

## Composants React

### App.tsx
```
┌──────────────────────────────────────────────────┐
│ App                                              │
│ ┌──────────────┬───────────────────────────────┐ │
│ │ UploadSidebar│         GraphView             │ │
│ │   (300px)    │         (flex-1)              │ │
│ │              │                               │ │
│ │ - DropZone   │     [Force Graph 2D]          │ │
│ │ - FileQueue  │                               │ │
│ │ - TagEditor  │                               │ │
│ │              │                               │ │
│ └──────────────┴───────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ FilePreview (Modal, conditionnel)            │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### State Management
- **Convex queries** pour les données persistées (files, tags, fileTags)
- **React state local** pour :
  - Fichier en cours d'upload
  - Tags suggérés (avant validation)
  - Fichier sélectionné pour preview
  - État UI (loading, errors)

### GraphView - Structure des données

```typescript
interface GraphData {
  nodes: Array<{
    id: string;           // 'file:xxx' ou 'tag:xxx'
    type: 'file' | 'tag';
    name: string;
    // Pour les fichiers
    fileId?: string;
    thumbnailUrl?: string;
    mimeType?: string;
    // Pour les tags
    tagId?: string;
    color?: string;
  }>;
  links: Array<{
    source: string;       // id du noeud fichier
    target: string;       // id du noeud tag
  }>;
}
```

## Analyse IA - Prompt

```typescript
const ANALYSIS_PROMPT = `Analyze this image and suggest relevant tags for organizing it in a personal file system.

Rules:
- Return 3-8 tags maximum
- Tags should be single words or short phrases (2-3 words max)
- Use lowercase
- Be specific but not too granular
- Include: subject matter, setting, mood, colors, objects, people, activities
- Do NOT include: file metadata, technical details, quality assessments

Return ONLY a JSON array of strings, no explanation.
Example: ["nature", "forest", "green", "hiking", "summer"]`;
```

## Gestion des PDFs

Pour les PDFs, l'analyse se fait sur la première page convertie en image :

1. Utiliser pdf.js (pdfjs-dist) pour extraire la première page
2. Rendre la page sur un canvas
3. Convertir le canvas en base64
4. Envoyer à GPT-4o-mini

Alternative simplifiée pour le POC : utiliser un service de conversion PDF→image côté serveur, ou simplement ne pas analyser les PDFs et demander des tags manuels.

## Sécurité (POC)

- Pas d'auth = données accessibles par tous
- OpenAI API key stockée dans Convex env vars (pas exposée au client)
- Validation des types de fichiers côté client ET serveur
- Limite de taille fichier (20MB max pour Convex HTTP actions)

## Points d'attention

1. **Performance graphe** : react-force-graph peut ralentir avec beaucoup de noeuds. Pour le POC, limiter à ~100 noeuds.

2. **Coûts OpenAI** : GPT-4o-mini est économique mais surveiller l'usage. Prévoir un indicateur de coût.

3. **Temps d'analyse** : L'appel OpenAI peut prendre 3-10 secondes. UX importante (loading state, possibilité d'annuler).

4. **Gestion erreurs** : Pour le POC, afficher les erreurs simplement. Pas de retry automatique.
