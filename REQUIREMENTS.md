# TagExplorer - Requirements

## Vision
Remplacer la hiérarchie classique des fichiers par un système basé sur des tags avec visualisation en graphe style Obsidian.

---

## Functional Requirements

### FR-1: Upload de fichiers
- **FR-1.1**: L'utilisateur peut drag & drop des fichiers dans une zone dédiée (sidebar gauche)
- **FR-1.2**: Types supportés pour le POC : images (jpg, png, webp) et PDFs
- **FR-1.3**: Les fichiers sont stockés dans Convex File Storage
- **FR-1.4**: Feedback visuel pendant l'upload (progress indicator)

### FR-2: Analyse IA
- **FR-2.1**: Après upload, le fichier est envoyé à `openai/gpt-5-nano` via Vercel AI Gateway pour analyse
- **FR-2.2**: L'IA extrait des tags pertinents basés sur le contenu visuel/textuel
- **FR-2.3**: Pour les images : analyse du contenu visuel
- **FR-2.4**: Pour les PDFs : extraction de la première page comme image pour analyse
- **FR-2.5**: Retourne une liste de 3-8 tags suggérés par fichier

### FR-3: Validation des tags
- **FR-3.1**: Les tags suggérés sont affichés dans la sidebar après analyse
- **FR-3.2**: L'utilisateur peut accepter ou rejeter chaque tag individuellement
- **FR-3.3**: L'utilisateur peut ajouter des tags manuels (avec autocomplete sur tags existants)
- **FR-3.4**: Bouton "Valider" pour ajouter le fichier + tags au graphe

### FR-4: Visualisation graphe
- **FR-4.1**: Graphe force-directed occupant la zone principale de l'écran
- **FR-4.2**: Deux types de noeuds distincts visuellement :
  - Fichiers : affichés avec thumbnail (images) ou icône (PDFs)
  - Tags : forme/couleur différente des fichiers
- **FR-4.3**: Connexions (edges) entre fichiers et leurs tags
- **FR-4.4**: Zoom et pan natifs
- **FR-4.5**: Le graphe se met à jour en temps réel (Convex reactivity)

### FR-5: Preview fichiers
- **FR-5.1**: Clic sur un noeud fichier ouvre une preview
- **FR-5.2**: Preview en modal ou panel latéral
- **FR-5.3**: Affichage natif des images
- **FR-5.4**: Affichage des PDFs (embed ou pdf.js)
- **FR-5.5**: Métadonnées affichées : nom, type, date d'ajout, liste des tags

### FR-6: Gestion des tags
- **FR-6.1**: Création manuelle de tags (même sans fichier associé)
- **FR-6.2**: Autocomplete sur les tags existants lors de la saisie
- **FR-6.3**: Suppression d'un tag d'un fichier (depuis la preview)

---

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: Le graphe doit rester fluide jusqu'à ~100 noeuds pour le POC
- **NFR-1.2**: L'analyse IA doit retourner en < 10 secondes

### NFR-2: UX
- **NFR-2.1**: Interface responsive (desktop first pour le POC)
- **NFR-2.2**: Feedback immédiat sur toutes les actions utilisateur

### NFR-3: Simplicité
- **NFR-3.1**: Pas d'authentification pour le POC (single user)
- **NFR-3.2**: Pas de tests automatisés pour le POC
- **NFR-3.3**: Structure de code minimale, refactorable plus tard

---

## Out of Scope (POC)

Les fonctionnalités suivantes sont explicitement hors scope pour ce POC :
- Authentification / multi-utilisateurs
- Hiérarchie de tags (parents/enfants)
- Bulk upload avec analyse parallèle
- Recherche textuelle
- Filtrage du graphe par tags
- Export/Import de données
- Support audio/vidéo
- OCR avancé pour PDFs
- Quotas et rate limiting sur l'IA
- Tests automatisés
- CI/CD

---

## Data Model

### Table: files
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Identifiant unique (auto) |
| name | string | Nom du fichier original |
| type | string | MIME type (image/jpeg, application/pdf, etc.) |
| storageId | Id<"_storage"> | Référence vers Convex Storage |
| createdAt | number | Timestamp de création |

### Table: tags
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Identifiant unique (auto) |
| name | string | Nom du tag (unique, lowercase) |
| color | string? | Couleur optionnelle (hex) |

### Table: fileTags
| Field | Type | Description |
|-------|------|-------------|
| _id | Id | Identifiant unique (auto) |
| fileId | Id<"files"> | Référence vers le fichier |
| tagId | Id<"tags"> | Référence vers le tag |

---

## User Stories

### US-1: Upload et tag automatique
> En tant qu'utilisateur, je veux pouvoir drag & drop une photo et recevoir des suggestions de tags automatiques basées sur son contenu, afin de ne pas avoir à tagger manuellement chaque fichier.

**Acceptance Criteria:**
- [ ] Je peux drag & drop une image dans la sidebar
- [ ] Un indicateur de chargement apparaît pendant l'analyse
- [ ] Des tags suggérés apparaissent après quelques secondes
- [ ] Je peux accepter/rejeter chaque tag
- [ ] Je peux ajouter mes propres tags
- [ ] En validant, le fichier apparaît dans le graphe avec ses tags

### US-2: Navigation dans le graphe
> En tant qu'utilisateur, je veux voir tous mes fichiers et tags sous forme de graphe interconnecté, afin de visualiser les relations entre mes contenus.

**Acceptance Criteria:**
- [ ] Le graphe affiche fichiers et tags comme noeuds distincts
- [ ] Les connexions fichier-tag sont visibles
- [ ] Je peux zoomer et naviguer dans le graphe
- [ ] Le graphe se met à jour automatiquement quand j'ajoute du contenu

### US-3: Preview d'un fichier
> En tant qu'utilisateur, je veux pouvoir cliquer sur un fichier dans le graphe pour voir son contenu et ses métadonnées.

**Acceptance Criteria:**
- [ ] Clic sur un noeud fichier ouvre une preview
- [ ] Les images s'affichent correctement
- [ ] Les PDFs s'affichent correctement
- [ ] Je vois le nom, la date et les tags associés
