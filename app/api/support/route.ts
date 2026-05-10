import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = adminDb.collection("support_tickets").orderBy("createdAt", "desc").limit(100);
  if (status) query = query.where("status", "==", status) as typeof query;

  const snap = await query.get();
  const tickets = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ticketId, message, updateStatus } = await req.json();
  if (!ticketId || !message) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const ticketRef = adminDb.collection("support_tickets").doc(ticketId);
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const ticket = ticketDoc.data()!;

  const reply = {
    from: "admin",
    message,
    createdAt: new Date().toISOString(),
    adminEmail: session.email,
  };

  const updates: Record<string, unknown> = {
    messages: FieldValue.arrayUnion(reply),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (updateStatus) updates.status = updateStatus;

  await ticketRef.update(updates);

  if (ticket.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "NOCTEA Support <support@noctea.app>",
        to: ticket.email as string,
        subject: `Re: ${ticket.subject}`,
        html: `<p>Bonjour,</p><p>${message}</p><p>— L'équipe NOCTEA</p>`,
      });
    } catch (err) {
      console.error("[support] Email non envoyé:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ticketId, status } = await req.json();
  if (!ticketId || !status) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  await adminDb.collection("support_tickets").doc(ticketId).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
