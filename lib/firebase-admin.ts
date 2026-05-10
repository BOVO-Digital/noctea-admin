import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Firebase Admin SDK: variables d'environnement manquantes (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
      );
    }
    // En développement sans vars, init minimale pour éviter les crashes du build
    _app = initializeApp({ projectId: projectId ?? "noctea-dev" });
    return _app;
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return _app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

// Lazy proxies — safe à l'import
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const val = (auth as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const val = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});
