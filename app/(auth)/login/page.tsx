"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function handleSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Accès refusé");
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const idToken = await cred.user.getIdToken();
      await handleSession(idToken);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      toast.error(msg.includes("accès") ? msg : "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "apple") {
    setLoadingProvider(provider);
    try {
      const authProvider =
        provider === "google"
          ? new GoogleAuthProvider()
          : new OAuthProvider("apple.com");

      const cred = await signInWithPopup(getClientAuth(), authProvider);
      const idToken = await cred.user.getIdToken();
      await handleSession(idToken);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      if (msg.includes("popup-closed") || msg.includes("cancelled")) {
        // Fenêtre fermée par l'utilisateur — pas d'erreur à afficher
      } else if (msg.includes("NEXT_PUBLIC_FIREBASE_API_KEY")) {
        toast.error("Configuration Firebase manquante — remplissez le .env.local");
      } else if (msg.includes("Accès refusé") || msg.includes("accès")) {
        toast.error(msg);
      } else {
        toast.error(`Connexion échouée : ${msg}`);
      }
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1621] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#7CB9E8]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="NOCTEA"
              width={140}
              height={100}
              className="object-contain mb-2"
              priority
            />
            <p className="text-[#9ba5b3] text-sm">Tableau de bord administrateur</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#e5e7eb] text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@noctea.app"
                required
                className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#e5e7eb] text-sm">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] focus:border-[#D4AF37] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ba5b3] hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold h-11 rounded-xl transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3a4757]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1a2332] px-3 text-[#9ba5b3]">ou continuer avec</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              disabled={loadingProvider !== null}
              className="border-[#3a4757] bg-[#0f1621] hover:bg-[#212d40] text-[#e5e7eb] h-11 rounded-xl"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin("apple")}
              disabled={loadingProvider !== null}
              className="border-[#3a4757] bg-[#0f1621] hover:bg-[#212d40] text-[#e5e7eb] h-11 rounded-xl"
            >
              {loadingProvider === "apple" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Apple
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-[#9ba5b3] mt-6">
            Accès réservé aux administrateurs NOCTEA
          </p>
        </div>
      </motion.div>
    </div>
  );
}
