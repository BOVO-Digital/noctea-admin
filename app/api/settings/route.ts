import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [adminsSnap, logsSnap] = await Promise.all([
    adminDb.collection("admins").get(),
    adminDb.collection("system_logs").orderBy("createdAt", "desc").limit(50).get(),
  ]);

  const admins = adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const logs = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return NextResponse.json({ admins, logs });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "promote-admin") {
    const { email } = body;
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/admin/set-claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "promote" }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === "revoke-admin") {
    const { email } = body;
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/admin/set-claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "revoke" }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
