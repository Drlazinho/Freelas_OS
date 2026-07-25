import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · Freela.OS" },
      { name: "description", content: "Ajuste seu perfil, dados de faturamento e preferências." },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [documento, setDocumento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [banco, setBanco] = useState("");
  const [pix, setPix] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  
  const [notifEmailFaturas, setNotifEmailFaturas] = useState(true);
  const [notifEmailPrazos, setNotifEmailPrazos] = useState(true);
  const [notifPushTarefas, setNotifPushTarefas] = useState(false);
  const [notifSemanal, setNotifSemanal] = useState(true);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setEmpresa(profile.empresa || "");
      setDocumento(profile.documento || "");
      
      const db = profile.dados_bancarios || {};
      setEndereco(db.endereco || "");
      setBanco(db.banco || "");
      setPix(db.pix || "");
      setAgencia(db.agencia || "");
      setConta(db.conta || "");

      const notif = profile.notificacoes || {};
      setNotifEmailFaturas(notif.email_faturas ?? true);
      setNotifEmailPrazos(notif.email_prazos ?? true);
      setNotifPushTarefas(notif.push_tarefas ?? false);
      setNotifSemanal(notif.resumo_semanal ?? true);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar", { description: error.message });
    }
  });

  const savePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ nome });
  };

  const saveFaturamento = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      empresa,
      documento,
      dados_bancarios: {
        endereco, banco, pix, agencia, conta
      }
    });
  };

  const saveNotificacao = (key: string, value: boolean) => {
    const currentNotif = profile?.notificacoes || {
      email_faturas: notifEmailFaturas,
      email_prazos: notifEmailPrazos,
      push_tarefas: notifPushTarefas,
      resumo_semanal: notifSemanal
    };
    
    updateProfileMutation.mutate({
      notificacoes: { ...currentNotif, [key]: value }
    });
  };

  const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Configurações" description="Gerencie sua conta, faturamento e preferências." />

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={savePerfil} className="grid gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">{nome ? initials(nome) : "MF"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" size="sm">Trocar foto</Button>
                    <p className="mt-1 text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5"><Label>Nome completo</Label><Input value={nome} onChange={e => setNome(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                  <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={user?.email || ""} disabled /></div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturamento">
          <Card>
            <CardHeader><CardTitle>Dados de faturamento</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={saveFaturamento} className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5"><Label>Razão social / Nome</Label><Input value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="grid gap-1.5"><Label>CNPJ / CPF</Label><Input value={documento} onChange={e => setDocumento(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="grid gap-1.5 sm:col-span-2"><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <Separator className="sm:col-span-2 my-2" />
                <div className="grid gap-1.5"><Label>Banco</Label><Input value={banco} onChange={e => setBanco(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="grid gap-1.5"><Label>Chave Pix</Label><Input value={pix} onChange={e => setPix(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="grid gap-1.5"><Label>Agência</Label><Input value={agencia} onChange={e => setAgencia(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="grid gap-1.5"><Label>Conta</Label><Input value={conta} onChange={e => setConta(e.target.value)} disabled={updateProfileMutation.isPending} /></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card>
            <CardHeader><CardTitle>Preferências</CardTitle></CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-muted-foreground">Escolha entre claro e escuro.</p>
                </div>
                <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Idioma</p>
                  <p className="text-sm text-muted-foreground">Idioma da interface.</p>
                </div>
                <Select defaultValue="pt-BR">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Email: novas faturas</p>
                  <p className="text-sm text-muted-foreground">Receba um email quando uma nova fatura for gerada.</p>
                </div>
                <Switch checked={notifEmailFaturas} onCheckedChange={(v) => { setNotifEmailFaturas(v); saveNotificacao('email_faturas', v); }} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Email: prazos próximos</p>
                  <p className="text-sm text-muted-foreground">Alerta 3 dias antes do prazo final de projetos.</p>
                </div>
                <Switch checked={notifEmailPrazos} onCheckedChange={(v) => { setNotifEmailPrazos(v); saveNotificacao('email_prazos', v); }} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Push: tarefas atribuídas</p>
                  <p className="text-sm text-muted-foreground">Notificação no navegador para novas tarefas.</p>
                </div>
                <Switch checked={notifPushTarefas} onCheckedChange={(v) => { setNotifPushTarefas(v); saveNotificacao('push_tarefas', v); }} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">Resumo semanal</p>
                  <p className="text-sm text-muted-foreground">Um resumo do seu progresso toda segunda-feira.</p>
                </div>
                <Switch checked={notifSemanal} onCheckedChange={(v) => { setNotifSemanal(v); saveNotificacao('resumo_semanal', v); }} disabled={updateProfileMutation.isPending} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
