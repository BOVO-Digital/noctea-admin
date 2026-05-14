import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [adminsSnap, logsSnap] = await Promise.all([
    adminDb.collection("admins").get(),
    adminDb.collection("system_logs").orderBy("createdAt", "desc").limit(50).get(),
  ]);

  const admins = adminsSnap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }));
  const logs = logsSnap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }));

  return NextResponse.json({ admins, logs });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // ── Promouvoir un utilisateur existant ──────────────────────────────────────
  if (action === "promote-admin") {
    const { email } = body as { email: string };
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(user.uid, { role: "admin" });
      await adminDb.collection("admins").doc(user.uid).set(
        { uid: user.uid, email, role: "admin", promotedAt: FieldValue.serverTimestamp(), promotedBy: session.email },
        { merge: true }
      );
      return NextResponse.json({ ok: true, message: `${email} promu admin` });
    } catch {
      return NextResponse.json({ error: "Utilisateur introuvable — il doit d'abord créer un compte NOCTEA" }, { status: 404 });
    }
  }

  // ── Révoquer un admin ───────────────────────────────────────────────────────
  if (action === "revoke-admin") {
    const { email } = body as { email: string };
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
    try {
      const user = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(user.uid, { role: "user" });
      await adminDb.collection("admins").doc(user.uid).delete();
      return NextResponse.json({ ok: true, message: `Accès admin révoqué pour ${email}` });
    } catch {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
  }

  // ── Inviter un nouvel admin (crée compte + envoie email d'invitation) ────────
  if (action === "invite-admin") {
    const { email, displayName } = body as { email: string; displayName?: string };
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    let uid: string;
    let created = false;

    try {
      // Vérifier si le compte existe déjà
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    } catch {
      // Créer le compte Firebase Auth
      const newUser = await adminAuth.createUser({
        email,
        displayName: displayName ?? email.split("@")[0],
        emailVerified: false,
      });
      uid = newUser.uid;
      created = true;
    }

    // Définir le rôle admin
    await adminAuth.setCustomUserClaims(uid, { role: "admin" });

    // Enregistrer dans Firestore
    await adminDb.collection("admins").doc(uid).set(
      {
        uid,
        email,
        displayName: displayName ?? null,
        role: "admin",
        invitedBy: session.email,
        invitedAt: FieldValue.serverTimestamp(),
        status: "invited",
      },
      { merge: true }
    );

    // Générer le lien de réinitialisation de mot de passe (= activation du compte)
    let actionLink: string;
    try {
      actionLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
      });
    } catch {
      actionLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
    }

    // Envoyer l'email d'invitation via Resend
    const adminPanelUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "NOCTEA Admin <noreply@noctea.app>",
        to: email,
        subject: "Vous êtes invité(e) à rejoindre NOCTEA Admin",
        html: buildInviteEmail({
          email,
          displayName: displayName ?? email.split("@")[0],
          invitedBy: session.email,
          actionLink,
          adminPanelUrl,
          created,
        }),
      });
    } catch (err) {
      console.error("[invite-admin] Email non envoyé:", err);
      // Ne pas bloquer si l'email échoue
    }

    return NextResponse.json({
      ok: true,
      uid,
      created,
      message: created
        ? `Compte créé et invitation envoyée à ${email}`
        : `${email} promu admin — invitation envoyée`,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

// ── Template email invitation ────────────────────────────────────────────────
function buildInviteEmail({
  email,
  displayName,
  invitedBy,
  actionLink,
  adminPanelUrl,
  created,
}: {
  email: string;
  displayName: string;
  invitedBy: string;
  actionLink: string;
  adminPanelUrl: string;
  created: boolean;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1621;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">
    <div style="background:#1a2332;border:1px solid #3a4757;border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a2332 0%,#0f1621 100%);padding:32px;text-align:center;border-bottom:1px solid #3a4757;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;margin-bottom:16px;">
          <span style="font-size:24px;">🌙</span>
        </div>
        <h1 style="margin:0;color:#D4AF37;font-size:22px;font-weight:700;letter-spacing:-0.5px;">NOCTEA Admin</h1>
        <p style="margin:4px 0 0;color:#9ba5b3;font-size:13px;">Interface d'administration</p>
      </div>
      <!-- Body -->
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;color:#e5e7eb;font-size:18px;">Bonjour ${displayName} 👋</h2>
        <p style="margin:0 0 20px;color:#9ba5b3;font-size:14px;line-height:1.6;">
          <strong style="color:#e5e7eb;">${invitedBy}</strong> vous a invité(e) à rejoindre l'équipe d'administration NOCTEA.
          Vous avez maintenant accès à l'interface d'administration.
        </p>
        ${created ? `
        <div style="background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#D4AF37;font-size:13px;font-weight:600;">📧 ${email}</p>
          <p style="margin:0;color:#9ba5b3;font-size:13px;line-height:1.5;">
            Un compte a été créé avec cette adresse. Cliquez le bouton ci-dessous pour définir votre mot de passe, 
            ou connectez-vous directement via <strong style="color:#e5e7eb;">Google</strong> si vous utilisez la même adresse Gmail.
          </p>
        </div>
        ` : `
        <div style="background:rgba(124,185,232,0.05);border:1px solid rgba(124,185,232,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#9ba5b3;font-size:13px;line-height:1.5;">
            Votre compte existant a été promu au rôle d'administrateur. Connectez-vous avec vos identifiants habituels.
          </p>
        </div>
        `}
        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${actionLink}" style="display:inline-block;background:#D4AF37;color:#0f1621;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
            ${created ? "Définir mon mot de passe" : "Accéder au panneau admin"}
          </a>
        </div>
        <p style="margin:0 0 8px;color:#9ba5b3;font-size:12px;text-align:center;">
          Ou accédez directement :
          <a href="${adminPanelUrl}" style="color:#D4AF37;text-decoration:none;">${adminPanelUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #3a4757;margin:24px 0;">
        <p style="margin:0;color:#9ba5b3;font-size:12px;text-align:center;">
          Ce lien expire dans 24h · Si vous n'attendiez pas cette invitation, ignorez cet email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
