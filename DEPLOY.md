# NOCTEA Admin — Guide de Déploiement

## 1. Prérequis

- Compte Vercel connecté à GitHub (`bovo-digital/noctea-admin`)
- Projet Firebase `noctea-dev` configuré
- Clé de service Firebase Admin SDK (depuis Firebase Console > Project Settings > Service Accounts)

## 2. Variables d'environnement Vercel

Dans le Dashboard Vercel (Project > Settings > Environment Variables), ajouter :

```
FIREBASE_PROJECT_ID=noctea-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@noctea-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=noctea-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=noctea-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=noctea-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

RESEND_API_KEY=re_xxxx
STRIPE_SECRET_KEY=sk_test_xxxx
ADMIN_BOOTSTRAP_TOKEN=change-this-secret-token
```

## 3. Déploiement

```bash
# Depuis le dossier noctea-admin
git init
git add .
git commit -m "Initial commit NOCTEA Admin V1"
git remote add origin https://github.com/BOVO-Digital/noctea-admin.git
git branch -M main
git push -u origin main
```

Vercel déploie automatiquement sur push.

## 4. Domaine personnalisé

Dans Vercel Dashboard > Domains, ajouter `admin.noctea.app`.
Configurer le DNS chez votre registrar :
- Type : CNAME
- Name : admin
- Value : cname.vercel-dns.com

## 5. Premier admin

Une fois déployé, utiliser la Cloud Function `bootstrapAdmin` :

```bash
curl -X POST https://europe-west1-noctea-dev.cloudfunctions.net/bootstrapAdmin \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com", "token": "noctea-bootstrap-2026"}'
```

Puis se connecter sur `admin.noctea.app`.

## 6. Configuration Firebase Auth

Dans Firebase Console > Authentication > Sign-in method, activer :
- Email/Password
- Google
- Apple

Pour Apple, configurer le Service ID et les clés dans Firebase Console.
