"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Send, Eye, Code2, List } from "lucide-react";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  category?: string;
}

interface EmailSequence {
  id: string;
  name: string;
  trigger: string;
  active: boolean;
  steps?: { delay: number; templateId: string }[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  waitlist: { label: "Waitlist", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  transactionnel: { label: "Transactionnel", color: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  marketing: { label: "Marketing", color: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
};

const TRIGGER_LABELS: Record<string, string> = {
  waitlist_signup: "Inscription waitlist",
  user_signup: "Inscription utilisateur",
  plan_upgrade: "Upgrade de plan",
};

export default function EmailsClient() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
  const [editHtml, setEditHtml] = useState("");
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editCategory, setEditCategory] = useState("transactionnel");
  const [sendTo, setSendTo] = useState("");
  const [sendTemplateId, setSendTemplateId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/emails?type=templates"),
        fetch("/api/emails?type=sequences"),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTemplates(tData.templates ?? []);
      setSequences(sData.sequences ?? []);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openEdit(template?: EmailTemplate) {
    if (template) {
      setSelectedTemplate(template);
      setEditHtml(template.html);
      setEditName(template.name);
      setEditSubject(template.subject);
      setEditCategory(template.category ?? "transactionnel");
    } else {
      setSelectedTemplate(null);
      setEditHtml("<html><body><p>Nouveau template</p></body></html>");
      setEditName("");
      setEditSubject("");
      setEditCategory("transactionnel");
    }
    setEditOpen(true);
  }

  async function saveTemplate() {
    try {
      await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-template",
          id: selectedTemplate?.id,
          template: { name: editName, subject: editSubject, html: editHtml, category: editCategory },
        }),
      });
      toast.success("Template sauvegardé");
      setEditOpen(false);
      fetchData();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  async function sendManual() {
    if (!sendTo || !sendTemplateId) {
      toast.error("Destinataire et template requis");
      return;
    }
    try {
      await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-manual",
          templateId: sendTemplateId,
          to: sendTo,
          variables: {},
        }),
      });
      toast.success("Email envoyé via Resend");
      setSendOpen(false);
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-[#1a2332]" />)}
    </div>
  );

  return (
    <>
      <Tabs defaultValue="templates" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#1a2332] border border-[#3a4757]">
            <TabsTrigger value="templates" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
              <Code2 className="w-3.5 h-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="sequences" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
              <List className="w-3.5 h-3.5" />
              Séquences
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSendOpen(true)}
              variant="outline"
              size="sm"
              className="border-[#3a4757] bg-[#0f1621] text-[#e5e7eb] hover:text-[#D4AF37] gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Envoi manuel
            </Button>
            <Button
              onClick={() => openEdit()}
              size="sm"
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau template
            </Button>
          </div>
        </div>

        <TabsContent value="templates">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
            {templates.length === 0 ? (
              <div className="text-center py-16 text-[#9ba5b3]">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun template. Créez-en un !</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a3a52]">
                {templates.map((t) => {
                  const cat = CATEGORY_LABELS[t.category ?? "transactionnel"] ?? CATEGORY_LABELS.transactionnel;
                  return (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors">
                      <div>
                        <p className="text-white font-medium">{t.name}</p>
                        <p className="text-[#9ba5b3] text-xs mt-0.5">{t.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${cat.color} text-xs`}>{cat.label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(t)}
                          className="text-[#9ba5b3] hover:text-white gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Éditer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sequences">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
            {sequences.length === 0 ? (
              <div className="text-center py-16 text-[#9ba5b3]">
                <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune séquence configurée.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a3a52]">
                {sequences.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors">
                    <div>
                      <p className="text-white font-medium">{s.name}</p>
                      <p className="text-[#9ba5b3] text-xs mt-0.5">
                        Déclencheur : {TRIGGER_LABELS[s.trigger] ?? s.trigger} · {s.steps?.length ?? 0} étape(s)
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={s.active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20"
                      }
                    >
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template editor dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Modifier le template" : "Nouveau template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Nom</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#0f1621] border-[#3a4757] text-white"
                  placeholder="welcome_email"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Catégorie</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                    <SelectItem value="waitlist" className="text-[#e5e7eb] focus:bg-[#212d40]">Waitlist</SelectItem>
                    <SelectItem value="transactionnel" className="text-[#e5e7eb] focus:bg-[#212d40]">Transactionnel</SelectItem>
                    <SelectItem value="marketing" className="text-[#e5e7eb] focus:bg-[#212d40]">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Sujet</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="bg-[#0f1621] border-[#3a4757] text-white"
                placeholder="Bienvenue sur NOCTEA, {{prenom}} !"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#9ba5b3]">HTML</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode("code")}
                    className={`gap-1 h-7 ${previewMode === "code" ? "text-[#D4AF37]" : "text-[#9ba5b3]"}`}
                  >
                    <Code2 className="w-3 h-3" /> Code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode("preview")}
                    className={`gap-1 h-7 ${previewMode === "preview" ? "text-[#D4AF37]" : "text-[#9ba5b3]"}`}
                  >
                    <Eye className="w-3 h-3" /> Aperçu
                  </Button>
                </div>
              </div>

              {previewMode === "code" ? (
                <div className="rounded-xl overflow-hidden border border-[#3a4757]">
                  <MonacoEditor
                    height="300px"
                    language="html"
                    theme="vs-dark"
                    value={editHtml}
                    onChange={(v) => setEditHtml(v ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-[#3a4757] bg-white overflow-hidden" style={{ height: 300 }}>
                  <iframe
                    srcDoc={editHtml}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}
              className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">
              Annuler
            </Button>
            <Button onClick={saveTemplate} className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold">
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send manual dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <DialogHeader>
            <DialogTitle>Envoi manuel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Template</Label>
              <Select value={sendTemplateId} onValueChange={setSendTemplateId}>
                <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                  <SelectValue placeholder="Choisir un template..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-[#e5e7eb] focus:bg-[#212d40]">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Destinataire(s)</Label>
              <Input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="bg-[#0f1621] border-[#3a4757] text-white"
                placeholder="email@exemple.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}
              className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">
              Annuler
            </Button>
            <Button onClick={sendManual} className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2">
              <Send className="w-4 h-4" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
