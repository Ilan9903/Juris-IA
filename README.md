# Juris-IA

Juris-IA est une plateforme web d’assistance juridique augmentée par intelligence artificielle. Elle permet d’analyser des documents juridiques (contrats, décisions, etc.), d’obtenir des réponses à des questions ciblées sur ces documents, et de bénéficier d’un chatbot spécialisé dans le droit. L’application est pensée pour les professionnels du droit, les entrepreneurs, ou toute personne souhaitant obtenir une aide juridique rapide et personnalisée, tout en gardant la maîtrise sur ses propres documents.

---

## 🚀 Fonctionnalités principales

- **Analyse de documents juridiques assistée par l’IA :**
  - Téléversement de documents au format TXT, PDF ou DOCX.
  - Extraction du texte, découpage automatique si besoin, et envoi du contexte à l’IA.
  - Posez une question sur le document (ex : “Quelles sont les obligations du prestataire ?”) et obtenez une réponse précise basée uniquement sur le contenu transmis.
  - Résumé automatique, identification de clauses clés, etc.

- **Chatbot juridique intelligent :**
  - Conversation avec un assistant IA spécialisé en droit (basé sur GPT 4.1-mini).
  - Historique des conversations et gestion multi-conversations.
  - Personnalisation du prompt système (assistant général, expert en droit du travail, etc.).

- **Base d’articles juridiques et moteur de recherche :**
  - Stockage, classement et recherche d’articles de loi, de jurisprudence ou de doctrine.
  - Visualisation du texte intégral, catégories, téléchargement PDF (si disponible).

- **Gestion des utilisateurs et sécurité :**
  - Authentification sécurisée via JWT (tokens, cookies HTTP-only, etc.).
  - Droits d’accès différenciés (ex : création/modification réservée aux admins).
  - Toutes les actions sensibles sont protégées par des middlewares de vérification.

---

## 🛠️ Stack technique MERN

- **Frontend :**
  - React + TypeScript + Vite
  - Consommation d’API REST
  - UI dynamique (upload de documents, chat, recherche, etc.)

- **Backend :**
  - Node.js + Express
  - MongoDB (stockage utilisateurs, conversations, articles juridiques)
  - Contrôleurs d’API RESTful pour les fonctionnalités principales
  - Utilisation de OpenAI GPT-4.1 (ou modèle compatible) pour l’analyse et la génération de texte

- **Outils & middlewares :**
  - Multer : gestion de l’upload de fichiers
  - pdf-parse, mammoth : extraction du texte des PDF/DOCX
  - Sécurité : JWT, Bcrypt, middlewares custom
  - Environnement Docker recommandé pour la stack complète

---

## 📦 Structure du projet

```
Juris-IA/
├── backend/
│   ├── src/                     # Code source Node/Express (API, modèles, contrôleurs)
│   ├── test/                    # Données de test et scripts
│   └── README.md
├── frontend/
│   ├── src/                     # Code source React/TS (pages, composants, helpers API)
│   └── README.md
└── README.md                    # Ce fichier
```

---

## ⚙️ Installation & lancement rapide

### Prérequis

- Node.js (>=18)
- npm ou yarn
- MongoDB (local ou cloud)
- (optionnel) Docker

### 1. Cloner le repo

```bash
git clone https://github.com/Ilan9903/Juris-IA.git
cd Juris-IA
```

### 2. Lancer le backend

```bash
cd backend
npm install
cp .env.example .env   # puis configurez les variables (clé OpenAI, URI MongoDB, etc.)
npm run dev            # ou: npm start
```

### 3. Lancer le frontend

```bash
cd ../frontend
npm install
npm run dev
```

- Frontend : http://localhost:5173/
- Backend API : http://localhost:8000/ (par défaut)

---

## 🧩 Exemples d’utilisation

- **Analyser un contrat PDF** : uploadez le fichier, posez “Quelles sont les obligations du client ?”, l’IA résume ou cite les passages pertinents.
- **Chat juridique** : “Quels sont les délais de préavis pour une démission en CDD ?”
- **Recherche d’articles** : retrouvez, triez et consultez les textes ou jurisprudences indexées dans la base.

---

## 🔒 Sécurité & confidentialité

- Les documents téléversés sont traités localement puis supprimés après analyse.
- Les conversations et historiques sont liés à l’utilisateur et non publics.
- Authentification JWT, mots de passe hashés, cookies HTTP-only.

---

## 📚 Dépendances principales

- Backend : express, mongoose, jsonwebtoken, bcrypt, multer, pdf-parse, mammoth, openai…
- Frontend : react, typescript, vite, axios…

---

## ✨ Contributions

- Issues et PR bienvenues !
- Pour toute suggestion ou bug, ouvrez une issue sur le dépôt.

---

**Auteur : [Ilan9903](https://github.com/Ilan9903)**
