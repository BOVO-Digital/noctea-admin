import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "templates";

  if (type === "templates") {
    const snap = await adminDb.collection("email_templates").orderBy("createdAt", "desc").get();
    const templates = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ templates });
  }

  if (type === "sequences") {
    const snap = await adminDb.collection("email_sequences").get();
    const sequences = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ sequences });
  }

  return NextResponse.json({ error: "Type invalide" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "save-template") {
    const { id, template } = body;
    if (id) {
      await adminDb.collection("email_templates").doc(id).update({ ...template, updatedAt: new Date() });
    } else {
      await adminDb.collection("email_templates").add({ ...template, createdAt: new Date() });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "send-manual") {
    const { templateId, to, variables = {} } = body;
    const templateDoc = await adminDb.collection("email_templates").doc(templateId).get();
    if (!templateDoc.exists) return NextResponse.json({ error: "Template introuvable" }, { status: 404 });

    const template = templateDoc.data()!;
    let html = template.html as string;
    let subject = template.subject as string;

    Object.entries(variables).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, String(value));
      subject = subject.replaceAll(`{{${key}}}`, String(value));
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "NOCTEA <noreply@noctea.app>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
