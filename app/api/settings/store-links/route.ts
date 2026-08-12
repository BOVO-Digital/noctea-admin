import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";
import { FieldValue } from "firebase-admin/firestore";

const DEFAULT_LINKS = {
  appStoreUrl: "https://apps.apple.com/app/noctea",
  playStoreUrl: "https://play.google.com/store/apps/details?id=app.noctea.mobile",
};

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const snap = await adminDb.doc("settings/app").get();
  const data = snap.exists ? serializeDoc(snap.data()!) : {};
  return NextResponse.json({
    appStoreUrl: (data.appStoreUrl as string) || DEFAULT_LINKS.appStoreUrl,
    playStoreUrl: (data.playStoreUrl as string) || DEFAULT_LINKS.playStoreUrl,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const appStoreUrl = typeof body.appStoreUrl === "string" ? body.appStoreUrl.trim() : "";
  const playStoreUrl = typeof body.playStoreUrl === "string" ? body.playStoreUrl.trim() : "";

  if (!appStoreUrl || !playStoreUrl) {
    return NextResponse.json({ error: "Les deux URLs sont requises" }, { status: 400 });
  }

  await adminDb.doc("settings/app").set(
    {
      appStoreUrl,
      playStoreUrl,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.email,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, appStoreUrl, playStoreUrl });
}
