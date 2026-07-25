import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { KanbanBoard } from "@/components/kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, Copy, Plus, Wallet, Loader2, Edit2, Trash2, X, Receipt } from "lucide-react";
import { brl, dataBR } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/projetos_/$id")({
  component: ProjetoDetalhes,
});

const statusVariant = (s: string) => {
  if (s === "Ativo") return "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] border border-[oklch(var(--success)/0.3)]";
  if (s === "Pausado") return "bg-warning/15 text-warning border border-warning/30";
  return "bg-muted text-muted-foreground border border-border";
};

function ProjetoDetalhes() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataInput, setDataInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [horasInput, setHorasInput] = useState("");

  const { data: projeto, isLoading: loadingProjeto } = useQuery({
    queryKey: ["projeto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select(`
          *,
          clientes ( nome ),
          tarefas ( id, status, estimativa )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: sheet = [], isLoading: loadingSheet } = useQuery({
    queryKey: ["timesheet", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheet_entries")
        .select("*")
        .eq("projeto_id", id)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const resetForm = () => {
    setEditingId(null);
    setDataInput("");
    setDescInput("");
    setHorasInput("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        projeto_id: id,
        data: dataInput,
        descricao: descInput,
        horas: Number(horasInput),
        user_id: user!.id
      };

      if (editingId) {
        const { data, error } = await supabase.from("timesheet_entries").update(payload).eq("id", editingId).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("timesheet_entries").insert([payload]).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet", id] });
      toast.success(editingId ? "Registro atualizado com sucesso" : "Horas registradas com sucesso");
      resetForm();
    },
    onError: (error) => {
      toast.error(editingId ? "Erro ao atualizar registro" : "Erro ao registrar horas", { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (tsId: string) => {
      const { error } = await supabase.from("timesheet_entries").delete().eq("id", tsId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheet", id] });
      toast.success("Registro excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir registro", { description: error.message });
    }
  });

  const totalHoras = sheet.reduce((acc: number, t: any) => acc + Number(t.horas), 0);
  const totalFaturar = projeto?.modelo === "Hora" ? totalHoras * Number(projeto.valor) : Number(projeto?.valor || 0);

  const tarefasTotais = projeto?.tarefas?.length || 0;
  const tarefasConcluidas = projeto?.tarefas?.filter((t: any) => t.status === "Concluído").length || 0;
  const progressoTarefas = tarefasTotais === 0 ? 0 : Math.round((tarefasConcluidas / tarefasTotais) * 100);

  const horasEstimadas = projeto?.tarefas?.reduce((acc: number, t: any) => acc + Number(t.estimativa || 0), 0) || 0;
  const progressoHoras = horasEstimadas === 0 ? 0 : Math.round((totalHoras / horasEstimadas) * 100);

  const createFaturaMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      // Vencimento: dia 15 do próximo mês
      const vencimentoDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      const vencimentoIso = vencimentoDate.toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("faturas")
        .insert([{
          cliente_id: projeto.cliente_id,
          projeto_id: projeto.id,
          valor: totalFaturar,
          vencimento: vencimentoIso,
          status: "Aguardando",
          user_id: user!.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Fatura criada com sucesso! Acesse o menu Financeiro para visualizá-la.");
    },
    onError: (error) => {
      toast.error("Erro ao criar fatura", { description: error.message });
    }
  });

  if (loadingProjeto) {
    return (
      <AppLayout>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!projeto) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-bold">Projeto não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate({ to: "/projetos" })}>Voltar para projetos</Button>
        </div>
      </AppLayout>
    );
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInput || !descInput || !horasInput) return;
    saveMutation.mutate();
  };

  const handleEditTs = (t: any) => {
    setEditingId(t.id);
    setDataInput(t.data);
    setDescInput(t.descricao);
    setHorasInput(t.horas.toString());
  };

  const handleDeleteTs = (tsId: string) => {
    if (confirm("Deseja realmente excluir este registro?")) {
      deleteMutation.mutate(tsId);
    }
  };

  const handleExport = () => {
    const sorted = [...sheet].sort((a: any, b: any) => a.data.localeCompare(b.data)); // Ordem para exportação
    const text = sorted.map((t: any) => `${t.data} - ${t.descricao} - ${t.horas}h`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Relatório copiado para a área de transferência!");
  };

  const handleCreateFatura = () => {
    if (totalFaturar <= 0) {
      toast.error("O valor a faturar deve ser maior que zero.");
      return;
    }
    createFaturaMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/projetos" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{projeto.nome}</h1>
          <p className="text-sm text-muted-foreground">{projeto.clientes?.nome}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{projeto.modelo}</Badge>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusVariant(projeto.status)}`}>{projeto.status}</span>
        </div>
      </div>

      <Tabs defaultValue="timesheet" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="tarefas">Quadro de Tarefas</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Progresso de Entregas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Tarefas Concluídas</span>
                  <span className="font-medium">{tarefasConcluidas} de {tarefasTotais}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Progresso Atual</span>
                  <span>{progressoTarefas}%</span>
                </div>
                <Progress value={progressoTarefas} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Esforço (Horas)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Horas Consumidas</span>
                  <span className="font-medium">{totalHoras}h de {horasEstimadas}h</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Esforço Utilizado</span>
                  <span className={progressoHoras > 100 ? "text-destructive font-medium" : ""}>{progressoHoras}%</span>
                </div>
                <Progress value={progressoHoras > 100 ? 100 : progressoHoras} className={`h-2 ${progressoHoras > 100 ? '[&>div]:bg-destructive' : ''}`} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tarefas">
          <KanbanBoard projectId={id} />
        </TabsContent>

        <TabsContent value="timesheet">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Horas Registradas</p>
                  <p className="text-2xl font-bold">{totalHoras}h</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa do Projeto</p>
                  <p className="text-2xl font-bold">{projeto.modelo === "Hora" ? `${brl(projeto.valor)}/h` : 'Fixo'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Acumulado a Faturar</p>
                  <p className="text-2xl font-bold">{brl(totalFaturar)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
              <CardTitle className="text-base">Histórico de Horas</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Relatório
                </Button>
                <Button size="sm" onClick={handleCreateFatura} disabled={createFaturaMutation.isPending}>
                  {createFaturaMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                  Gerar Fatura
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`p-4 border-b border-border transition-colors ${editingId ? 'bg-primary/5' : 'bg-muted/40'}`}>
                {editingId && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary flex items-center gap-2"><Edit2 className="h-4 w-4" /> Editando registro</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={resetForm}><X className="h-3 w-3 mr-1" /> Cancelar</Button>
                  </div>
                )}
                <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="grid gap-1.5 flex-1 w-full sm:w-auto">
                    <Label htmlFor="data">Data</Label>
                    <Input id="data" type="date" value={dataInput} onChange={e => setDataInput(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <div className="grid gap-1.5 flex-[3] w-full sm:w-auto">
                    <Label htmlFor="desc">Descrição da Atividade</Label>
                    <Input id="desc" placeholder="Ex: Criação da página inicial..." value={descInput} onChange={e => setDescInput(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <div className="grid gap-1.5 flex-1 w-full sm:w-auto">
                    <Label htmlFor="horas">Horas</Label>
                    <Input id="horas" type="number" min="0.5" step="0.5" placeholder="0" value={horasInput} onChange={e => setHorasInput(e.target.value)} required disabled={saveMutation.isPending} />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? <Edit2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />)} 
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                </form>
              </div>
              <div className="divide-y divide-border">
                {loadingSheet ? (
                  <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
                ) : sheet.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma hora registrada ainda.</div>
                ) : sheet.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/30 group">
                    <div className="flex items-start gap-4">
                      <span className="text-sm font-medium whitespace-nowrap w-20 text-primary">{dataBR(t.data)}</span>
                      <span className="text-sm text-foreground">{t.descricao}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="whitespace-nowrap">{t.horas}h</Badge>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditTs(t)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTs(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
