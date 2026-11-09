# Healthcare Knowledge Graph using NoSQL

Beginner-friendly mini-project starter using React + Vite + Firebase Firestore + React Flow.

## 1. Requirements
- Node.js LTS
- VS Code
- A Google account for Firebase

## 2. Install and run
Open this folder in VS Code, then run:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## 3. Connect Firebase
1. Open https://console.firebase.google.com/
2. Create a project and register a Web app.
3. Create a Cloud Firestore database.
4. In Project settings > General > Your apps, copy the Firebase web configuration.
5. Open `frontend/.env.example`, copy it to `frontend/.env`, and fill in the values.
6. Restart the Vite server after changing `.env`.

For local learning only, configure Firestore rules to allow access only to authenticated users once authentication is added. Do not publish this demo with open database rules. Use fictional sample data only.

## 4. What is included
- Dashboard with sample statistics
- Add disease, symptom, medicine, treatment, and patient records
- Add relationships between entities
- Interactive graph view
- Search entities
- Firebase Firestore persistence when configured
- Local demo mode when Firebase credentials are not yet added

## 5. Important
This is an educational prototype, not a medical diagnosis or treatment recommendation system. All sample data is fictional. Do not enter real patient information.
