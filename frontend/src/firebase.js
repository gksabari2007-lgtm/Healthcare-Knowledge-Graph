import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(
  config.apiKey &&
  config.projectId &&
  config.appId &&
  config.apiKey !== 'your_api_key' &&
  config.projectId !== 'your_project_id' &&
  config.appId !== 'your_app_id'
)

let firestoreDb = null
if (firebaseConfigured) {
  try {
    const app = initializeApp(config)
    firestoreDb = getFirestore(app)
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err)
  }
}

export const db = firestoreDb
