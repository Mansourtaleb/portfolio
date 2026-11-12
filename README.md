# Portfolio — Mohamed Mansour TALEB

Portfolio paramétrable : une vitrine publique alimentée par une API, un espace admin pour tout gérer en CRUD, et un assistant IA (RAG) qui répond aux recruteurs à partir du contenu du CV.

| Partie | Stack |
|---|---|
| Front | Angular 21 (standalone, signals, `@if`/`@for`), Tailwind CSS 4, design « Nuit tech » (thème sombre/clair) |
| API | Spring Boot 4.1 / Java 21, Spring Security + JWT, Spring Data JPA, Flyway, Bucket4j |
| Données | PostgreSQL 17 (Docker) |
| Assistant IA | Embeddings multilingues ONNX calculés localement + recherche hybride (sémantique + BM25) + Claude Haiku 5.5 en streaming (SSE) |

## Lancer en local

Prérequis : Java 21, Node 22, Docker Desktop.

```bash
cp .env.example .env          # puis remplir les valeurs (mot de passe admin, JWT_SECRET, clé Anthropic)
docker compose up -d db       # PostgreSQL sur le port 5434
cd backend && ./mvnw spring-boot:run      # API sur http://localhost:8080
cd frontend && npm install && npm start   # site sur http://localhost:4200 (proxy /api → 8080)
```

- Vitrine : http://localhost:4200
- Admin : http://localhost:4200/admin — identifiant `ADMIN_USERNAME` (par défaut `admin`), mot de passe `ADMIN_PASSWORD` du fichier `.env`. Le compte est créé au premier démarrage ; le mot de passe se change ensuite dans « Mon compte ».
- Au premier démarrage, Flyway crée le schéma et insère le contenu du CV (`V2__seed_content.sql`), et l'API télécharge une fois le modèle d'embeddings (~135 Mo, dossier `backend/.models`).
- Sans `ANTHROPIC_API_KEY`, tout fonctionne sauf les réponses de l'assistant (la bulle est masquée et l'admin le signale).

## Architecture

```
Angular (vitrine + /admin) ──/api──▶ Spring Boot ──▶ PostgreSQL
                                        │
                                        ├─ RAG : contenu visible → fiches → embeddings ONNX (local) + BM25
                                        └─ Claude Haiku 5.5 (SSE) ◀── fiches pertinentes + question
```

- **CRUD générique** : chaque section (compétences, expériences, projets, formation, certifications, langues, fiches assistant) hérite de `SectionService` / `SectionAdminController` : créer, modifier, supprimer, réordonner, publier/masquer.
- **Réindexation automatique** : toute modification publie un `ContentChangedEvent` ; l'index de l'assistant est reconstruit après le commit. Bouton « Ré-indexer le RAG » dans l'admin.
- **Sécurité** : JWT HS256 sans état, routes `/api/admin/**` réservées au scope `admin`, limitation de débit (connexion, contact, assistant), quota journalier de questions pour maîtriser les coûts, CV limité aux PDF de 5 Mo.

## Tests et build

```bash
cd backend && ./mvnw package      # compile + tests
cd frontend && npx ng build       # build de production dans frontend/dist
```

Le code de FinancAuto (projet PFE chez Teamwill) est confidentiel : il est décrit sur le site sans lien vers le code.
