# NOCTEA Admin

Back-office NOCTEA — gestion contenu, utilisateurs, signalements et configuration IA.

> **Dépôt** : `BOVO-Digital/noctea-admin`  
> **Stack** : Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Firebase Admin  
> **Firebase** : `noctea-dev`

---

## Démarrage local

```bash
cd noctea-admin
cp .env.example .env.local   # compléter les clés Firebase Admin
npm install
npm run dev                  # http://localhost:3000
```

Premier admin : appeler la Cloud Function `bootstrapAdmin` (voir `DEPLOY.md`).

---

## Modules

| Route | Description |
|-------|-------------|
| `/login` | Auth admin Firebase |
| `/content` | CMS — articles, stories, conseils, wellbeing |
| `/content` (onglet Signalements) | Modération `content_reports` |
| `/settings` | Config modèles IA + prompts éditables |
| `/users` | Gestion utilisateurs |
| `/emails` | Templates email |
| `/notifications` | Push (structure) |

---

## Workflow contenu IA

1. Génération IA → statut `pending_review` (jamais publié directement)
2. Validation admin → `published` ou `scheduled`
3. Modification d'un contenu publié → repasse `pending_review`
4. Refus → `archived`
5. Signalements mobile → traitement dans l'onglet Signalements

Collection Firestore : **`contents`** (champ `_type`, `targetPlan`, `showAiMention`, `sources`, `scheduledAt`).

---

## API routes principales

- `GET/POST/PATCH/DELETE /api/content`
- `POST /api/content/ai-generate`
- `POST /api/content/ai-regenerate-section`
- `GET/PATCH/POST /api/content-reports`
- `GET/PATCH /api/settings/ai-config`

---

## Déploiement

Voir **`DEPLOY.md`** (Vercel + variables d'environnement).

---

## Fichiers de suivi

- Roadmap : `../tasklists/admin.md`
- Décisions meeting contenu : `../new.md`
- État écosystème : `../STATE.md`
