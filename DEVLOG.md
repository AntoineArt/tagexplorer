# TagExplorer - Journal de Développement

## Session 1

### Phase 1 : Cadrage et documentation

Rédaction des documents fondateurs avant toute ligne de code :
- **REQUIREMENTS.md** : Vision, user stories, data model, scope du POC
- **ARCHITECTURE.md** : Schéma technique, flow upload/analyse, structure composants
- **CLAUDE.md** : Conventions, stack, patterns Convex, docs des dépendances

Recherche en ligne des docs à jour pour Convex (file storage, React quickstart) et Vercel AI Gateway (modèles disponibles, SDK).

**Choix du modèle IA** : L'intention initiale était `openai/gpt-5-nano` via Vercel AI Gateway, mais ce modèle ne supporte pas la vision. Basculé sur `google/gemini-2.5-flash-lite` (vision + économique).

### Phase 2 : Setup projet

- Init Vite + React + TypeScript
- Configuration Convex : schema (tables `files`, `tags`, `fileTags` avec index)
- Tailwind CSS v4 : problèmes de config avec PostCSS, résolu en passant au plugin `@tailwindcss/vite`

### Phase 3 : Backend Convex

- **files.ts** : `generateUploadUrl`, `saveFile`, `listFiles`, `getFileUrl`, `deleteFile`
- **tags.ts** : `createTag` (upsert par nom), `listTags`, `linkFileTag`, `unlinkFileTag`, `getFileTags`, `listFileTags`
- **analyze.ts** : Action Convex appelant Vercel AI Gateway
  - Images : conversion base64 + envoi vision
  - PDFs : extraction texte via `pdfreader` ; si < 100 caractères, traité comme PDF scanné (OCR via vision)
  - Problème initial avec `pdf-parse` (erreur ESM `No matching export for import "default"`), remplacé par `pdfreader`

### Phase 4 : UI Composants

- **uploadSidebar.tsx** : Sidebar redimensionnable (drag handle), drop zone, affichage suggestions, validation
- **dropZone.tsx** : Zone drag & drop avec feedback visuel
- **tagChip.tsx** : Chip toggle (sélection/désélection) avec glow effect
- **tagInput.tsx** : Input avec autocomplete sur tags existants
- **graphView.tsx** : Force graph 2D avec custom node rendering (glow, gradients, labels)
- **filePreview.tsx** : Modal preview (images, PDFs, métadonnées, tags, suppression)

### Phase 5 : Problèmes CSS / Tailwind

L'UI apparaissait cassée : couleurs et border-radius fonctionnaient mais pas les paddings. Cause : un reset CSS global `* { margin: 0; padding: 0; box-sizing: border-box; }` dans `index.css` qui écrasait les utilitaires Tailwind. Supprimé pour résoudre.

Ajout d'effets visuels : glassmorphism (`.glass`, `.glass-light`), animations (`pulse-glow`, `float`, `shimmer`, `spin-slow`), gradient borders, scrollbar custom.

### Phase 6 : Améliorations analyse IA

**Contexte des tags existants** : Le prompt IA inclut désormais la liste de tous les tags déjà utilisés dans le système, avec instruction de les réutiliser en priorité. Le LLM peut aussi proposer de nouveaux tags si pertinent.

**Distinction visuelle** : Les tags retournés sont séparés en deux catégories affichées distinctement dans la sidebar :
- Tags existants (emerald/teal)
- Nouveaux tags proposés (violet/purple)

Le format de retour de l'action `analyzeFile` est passé de `string[]` à `{ existingTags: string[], newTags: string[], suggestedName: string | null }`.

**Suggestion de renommage** : Si le nom du fichier n'est pas descriptif (ex: `IMG_20240301.jpg`), l'IA propose un meilleur nom. L'utilisateur peut l'éditer ou le rejeter avant validation.

### Phase 7 : Optimisation du graphe

**Blinking** : Chaque mutation Convex (saveFile, puis createTag + linkFileTag pour chaque tag) déclenchait un re-render du graphe. Résolu en créant une mutation `bulkLinkFileTags` qui crée tous les tags et liens en une seule transaction. Le graphe ne reçoit plus que 2 updates (fichier + tags) au lieu de 2N+1.

**Espacement** : Les clusters de noeuds étaient trop éloignés. Ajusté les forces d3 :
- Charge : -150 → -60
- Distance des liens : 100 → 50

---

## Problèmes rencontrés et solutions

| Problème | Solution |
|----------|----------|
| Tailwind v4 ne fonctionne pas avec `@tailwindcss/postcss` | Utiliser `@tailwindcss/vite` comme plugin Vite |
| `pdf-parse` erreur ESM import | Remplacé par `pdfreader` |
| `gpt-5-nano` ne supporte pas la vision | Basculé sur `google/gemini-2.5-flash-lite` |
| Erreur "Invalid image data" | Conversion correcte en base64 avec bon MIME type |
| Paddings Tailwind ne s'appliquent pas | Suppression du reset CSS global `* { padding: 0 }` |
| Graphe blink à chaque tag ajouté | Mutation bulk unique au lieu de N mutations séquentielles |
| Clusters trop espacés dans le graphe | Réduction charge (-60) et distance liens (50) |

## Stack finale

- React 18 + TypeScript + Vite
- Convex (DB + File Storage + Functions)
- Vercel AI Gateway → `google/gemini-2.5-flash-lite` (vision)
- react-force-graph-2d
- Tailwind CSS v4 (via @tailwindcss/vite)
- pdfreader (extraction texte PDF)
