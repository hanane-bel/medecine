# MedLegal 🏥⚖️

Bienvenue dans le dépôt du projet **MedLegal**, une application de gestion médicale et légale comprenant une interface administrateur et médecin (gestion des patients, formulaires de consultation, etc.).

## Architecture du Projet 🏗️
Ce projet est divisé en deux parties principales :
*   **Backend (`/backend`)** : API développée en Python avec **Django** et **Django REST Framework**.
    *   Authentification sécurisée via JWT.
    *   Base de données : SQLite par défaut (compatible PostgreSQL).
    *   Modules principaux : `accounts` (gestion des accès), `patients` (dossiers médicaux).
*   **Frontend (`/med`)** : Développé avec **Next.js** (React 19) et **TailwindCSS**.
    *   Espaces dédiés : Administrateurs (`/admin`) et Médecins (`/medecin`).
    *   Gestion de l'état global avec `Zustand`.
    *   Génération de documents PDF (rapports médicaux) via `html2pdf.js`.

## Prérequis ⚙️
Avant de lancer le projet, assurez-vous d'avoir installé :
*   [Node.js](https://nodejs.org/) (version 20+ recommandée)
*   [Python](https://www.python.org/) 
*   Git

## Installation et Démarrage Local 🚀

### 1. Démarrage Rapide (Windows)
Si vous êtes sous Windows, un script batch est fourni pour lancer simultanément le backend et le frontend :
```cmd
start.bat
```
*(Remarque : Assurez-vous que les dépendances sont déjà installées avant d'utiliser le script)*

---

### 2. Démarrage Manuel

#### Configuration du Backend (Django)
Ouvrez votre terminal et exécutez les commandes suivantes :
```bash
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv
# Activer l'environnement virtuel (Windows)
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations à la base de données
python manage.py makemigrations
python manage.py migrate

# Lancer le serveur de développement
python manage.py runserver 0.0.0.0:8000
```
Le backend sera accessible sur `http://127.0.0.1:8000`.

#### Configuration du Frontend (Next.js)
Dans un nouveau terminal :
```bash
cd med

# Installer les dépendances npm
npm install

# Lancer le serveur de développement
npm run dev
```
Le frontend sera accessible sur `http://localhost:3000`.

## Structure du Dépôt 📂
*   `backend/accounts/` : Gestion des utilisateurs, authentification.
*   `backend/patients/` : Logique de gestion des dossiers patients.
*   `med/app/admin/` : Pages et tableau de bord de l'administrateur.
*   `med/app/medecin/` : Interface médecin (liste des patients, formulaires de consultation).

## Technologies Utilisées 💻
*   **Frontend** : Next.js 16+, React 19, Tailwind CSS 4, Zustand
*   **Backend** : Python, Django 6, Django REST Framework, JWT
