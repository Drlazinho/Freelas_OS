import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { BriefingChat } from "@/components/briefing-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ArrowLeft,
  Loader2,
  Save,
  Link2,
  Send,
  ExternalLink,
  Printer,
  Plus,
  Trash2,
  X,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/briefings_/$id")({
  component: BriefingEditar,
});

type Funcionalidade = { titulo: string; descricao: string };
type Fase = { nome: string; prazo_dias: number; descricao: string };

const statusConfig: Record<string, { label: string; className: string }> = {
  Rascunho: {
    label: "Rascunho",
    className: "bg-muted text-muted-foreground border border-border",
  },
  Enviado: {
    label: "Enviado",
    className: "bg-primary/15 text-primary border border-primary/30",
  },
  Aprovado: {
    label: "Aprovado",
    className:
      "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] border border-[oklch(var(--success)/0.3)]",
  },
  Recusado: {
    label: "Recusado",
    className: "bg-destructive/15 text-destructive border border-destructive/30",
  },
};

const tipoOptions = ["Site", "App", "Sistema", "Landing Page", "API", "Outro"];

function BriefingEditar() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("");
  const [tecInput, setTecInput] = useState("");
  const [tecnologias, setTecnologias] = useState<string[]>([]);
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
  const [incluso, setIncluso] = useState("");
  const [naoIncluso, setNaoIncluso] = useState("");
  const [fases, setFases] = useState<Fase[]>([]);
  const [prazoTotal, setPrazoTotal] = useState("");
  const [modelo, setModelo] = useState("Fixo");
  const [valor, setValor] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [validadeProposta, setValidadeProposta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [clienteId, setClienteId] = useState("");

  const {
    data: briefing,
    isLoading,
  } = useQuery({
    queryKey: ["briefing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefings")
        .select("*, clientes ( nome, empresa )")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, empresa")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Populate form when briefing loads
  useEffect(() => {
    if (briefing) {
      setNome(briefing.nome || "");
      setDescricao(briefing.descricao || "");
      setTipo(briefing.tipo || "");
      setTecnologias(briefing.tecnologias || []);
      setFuncionalidades(
        (briefing.funcionalidades as Funcionalidade[]) || [],
      );
      setIncluso(briefing.incluso || "");
      setNaoIncluso(briefing.nao_incluso || "");
      setFases((briefing.fases as Fase[]) || []);
      setPrazoTotal(briefing.prazo_total || "");
      setModelo(briefing.modelo || "Fixo");
      setValor(briefing.valor?.toString() || "");
      setCondicoesPagamento(briefing.condicoes_pagamento || "");
      setValidadeProposta(
        briefing.validade_proposta
          ? briefing.validade_proposta.split("T")[0]
          : "",
      );
      setObservacoes(briefing.observacoes || "");
      setClienteId(briefing.cliente_id || "");
    }
  }, [briefing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("briefings")
        .update({
          nome,
          descricao,
          tipo,
          tecnologias,
          funcionalidades: funcionalidades as any,
          incluso,
          nao_incluso: naoIncluso,
          fases: fases as any,
          prazo_total: prazoTotal,
          modelo,
          valor: Number(valor) || 0,
          condicoes_pagamento: condicoesPagamento,
          validade_proposta: validadeProposta || null,
          observacoes,
          cliente_id: clienteId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefing", id] });
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      toast.success("Briefing salvo com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao salvar", { description: error.message });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("briefings")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefing", id] });
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      toast.success("Status atualizado");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("briefing_templates").insert([
        {
          user_id: user!.id,
          nome: `${nome} (Template)`,
          descricao,
          tipo,
          tecnologias,
          funcionalidades: funcionalidades as any,
          incluso,
          nao_incluso: naoIncluso,
          fases: fases as any,
          modelo,
          valor: Number(valor) || 0,
          condicoes_pagamento: condicoesPagamento,
          observacoes,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template salvo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar template", { description: error.message });
    },
  });

  const handleCopyLink = () => {
    if (!briefing) return;
    const url = `${window.location.origin}/b/${briefing.public_id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", { description: url });
  };

  const handleOpenPublic = () => {
    if (!briefing) return;
    window.open(`/b/${briefing.public_id}`, "_blank");
  };

  // Tech tags
  const addTec = () => {
    const t = tecInput.trim();
    if (t && !tecnologias.includes(t)) {
      setTecnologias([...tecnologias, t]);
    }
    setTecInput("");
  };
  const removeTec = (i: number) => {
    setTecnologias(tecnologias.filter((_, idx) => idx !== i));
  };

  // Funcionalidades
  const addFunc = () => {
    setFuncionalidades([...funcionalidades, { titulo: "", descricao: "" }]);
  };
  const updateFunc = (i: number, field: keyof Funcionalidade, val: string) => {
    const copy = [...funcionalidades];
    copy[i] = { ...copy[i], [field]: val };
    setFuncionalidades(copy);
  };
  const removeFunc = (i: number) => {
    setFuncionalidades(funcionalidades.filter((_, idx) => idx !== i));
  };

  // Fases
  const addFase = () => {
    setFases([...fases, { nome: "", prazo_dias: 0, descricao: "" }]);
  };
  const updateFase = (i: number, field: keyof Fase, val: string | number) => {
    const copy = [...fases];
    copy[i] = { ...copy[i], [field]: val };
    setFases(copy);
  };
  const removeFase = (i: number) => {
    setFases(fases.filter((_, idx) => idx !== i));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!briefing) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-bold">Briefing não encontrado</h2>
          <Button
            className="mt-4"
            onClick={() => navigate({ to: "/briefings" })}
          >
            Voltar para briefings
          </Button>
        </div>
      </AppLayout>
    );
  }

  const cfg = statusConfig[briefing.status] || statusConfig.Rascunho;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/briefings" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{briefing.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {briefing.clientes?.empresa
                ? `${briefing.clientes.empresa} · `
                : ""}
              {briefing.clientes?.nome || "Sem cliente vinculado"}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
          >
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveTemplateMutation.mutate()}
            disabled={saveTemplateMutation.isPending}
          >
            {saveTemplateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className="mr-2 h-4 w-4" />
            )}
            Salvar como Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Link2 className="mr-2 h-4 w-4" /> Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            if (briefing) {
              window.open(`/b/${briefing.public_id}?print=1`, "_blank");
            }
          }}>
            <Printer className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenPublic}>
            <ExternalLink className="mr-2 h-4 w-4" /> Visualizar
          </Button>
          {briefing.status === "Rascunho" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => statusMutation.mutate("Enviado")}
              disabled={statusMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" /> Marcar como Enviado
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projeto" className="w-full">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="projeto">Projeto</TabsTrigger>
          <TabsTrigger value="escopo">Escopo</TabsTrigger>
          <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
          <TabsTrigger value="investimento">Investimento</TabsTrigger>
          <TabsTrigger value="comentarios">Comentários</TabsTrigger>
        </TabsList>

        {/* TAB: Projeto */}
        <TabsContent value="projeto">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Nome do projeto</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Plataforma de Onboarding"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Cliente</Label>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.empresa ? `${c.empresa} · ` : ""}
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Descrição / Objetivo</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o objetivo do projeto..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Tipo de projeto</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Tecnologias</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tecInput}
                      onChange={(e) => setTecInput(e.target.value)}
                      placeholder="Ex.: React"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTec();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTec}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tecnologias.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tecnologias.map((t, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTec(i)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Escopo */}
        <TabsContent value="escopo">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Funcionalidades</CardTitle>
                <Button variant="outline" size="sm" onClick={addFunc}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {funcionalidades.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma funcionalidade adicionada.
                  </p>
                ) : (
                  funcionalidades.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start rounded-lg border border-border p-3"
                    >
                      <div className="flex-1 grid gap-2">
                        <Input
                          value={f.titulo}
                          onChange={(e) =>
                            updateFunc(i, "titulo", e.target.value)
                          }
                          placeholder="Nome da funcionalidade"
                          className="font-medium"
                        />
                        <Textarea
                          value={f.descricao}
                          onChange={(e) =>
                            updateFunc(i, "descricao", e.target.value)
                          }
                          placeholder="Descrição detalhada..."
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFunc(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">O que está incluso</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={incluso}
                    onChange={(e) => setIncluso(e.target.value)}
                    placeholder="• Design responsivo&#10;• Deploy em produção&#10;• 2 rodadas de revisão"
                    rows={5}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    O que NÃO está incluso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={naoIncluso}
                    onChange={(e) => setNaoIncluso(e.target.value)}
                    placeholder="• Conteúdo textual&#10;• Fotografias&#10;• SEO avançado"
                    rows={5}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Planejamento */}
        <TabsContent value="planejamento">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fases do Projeto</CardTitle>
                <Button variant="outline" size="sm" onClick={addFase}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar fase
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fases.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma fase adicionada.
                  </p>
                ) : (
                  fases.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start rounded-lg border border-border p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_100px]">
                        <div className="grid gap-2">
                          <Input
                            value={f.nome}
                            onChange={(e) =>
                              updateFase(i, "nome", e.target.value)
                            }
                            placeholder="Nome da fase (ex: Discovery)"
                            className="font-medium"
                          />
                          <Textarea
                            value={f.descricao}
                            onChange={(e) =>
                              updateFase(i, "descricao", e.target.value)
                            }
                            placeholder="O que será feito nessa fase..."
                            rows={2}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Prazo (dias)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={f.prazo_dias || ""}
                            onChange={(e) =>
                              updateFase(
                                i,
                                "prazo_dias",
                                Number(e.target.value),
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFase(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prazo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={prazoTotal}
                  onChange={(e) => setPrazoTotal(e.target.value)}
                  placeholder="Ex.: 45 dias úteis, 2 meses, etc."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Investimento */}
        <TabsContent value="investimento">
          <Card>
            <CardHeader>
              <CardTitle>Investimento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-1.5">
                <Label>Modelo de cobrança</Label>
                <ToggleGroup
                  type="single"
                  value={modelo}
                  onValueChange={(v) => v && setModelo(v)}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value="Fixo"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Valor Fixo
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="Hora"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Por Hora
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>
                    {modelo === "Hora" ? "Taxa/hora (R$)" : "Valor total (R$)"}
                  </Label>
                  <Input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Validade da proposta</Label>
                  <Input
                    type="date"
                    value={validadeProposta}
                    onChange={(e) => setValidadeProposta(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Condições de pagamento</Label>
                <Textarea
                  value={condicoesPagamento}
                  onChange={(e) => setCondicoesPagamento(e.target.value)}
                  placeholder="Ex.: 50% na aprovação + 50% na entrega&#10;ou 3x sem juros via Pix"
                  rows={3}
                />
              </div>

              <div className="grid gap-1.5">
                <Label>Observações adicionais</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações extras, ressalvas, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Comentários / Chat */}
        <TabsContent value="comentarios">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Chat com o Cliente</CardTitle>
            </CardHeader>
            <BriefingChat
              briefingId={id}
              autorTipo="freelancer"
              autorNome={profile?.nome || "Freelancer"}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
