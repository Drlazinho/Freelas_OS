import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Search, Loader2, MoreHorizontal, Edit2, Trash2, Eye } from "lucide-react";
import { brl, dataBR } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos · Freela.OS" },
      { name: "description", content: "Gerencie todos os seus projetos e acompanhe o progresso." },
    ],
  }),
  component: ProjetosPage,
});

const statusVariant = (s: string) => {
  if (s === "Ativo") return "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] border border-[oklch(var(--success)/0.3)]";
  if (s === "Pausado") return "bg-warning/15 text-warning border border-warning/30";
  return "bg-muted text-muted-foreground border border-border";
};

function ProjetosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const perPage = 5;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [modelo, setModelo] = useState<"Hora" | "Fixo">("Hora");
  const [valor, setValor] = useState("");
  const [inicio, setInicio] = useState("");
  const [prazo, setPrazo] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setNome(""); setClienteId(""); setValor(""); setInicio(""); setPrazo(""); setModelo("Hora");
  };

  const { data: projetos = [], isLoading: loadingProjetos } = useQuery({
    queryKey: ["projetos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select(`
          *,
          clientes ( nome, empresa ),
          tarefas ( id, status )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data.map((p: any) => {
        const total = p.tarefas?.length || 0;
        const concluidas = p.tarefas?.filter((t: any) => t.status === "Concluído").length || 0;
        const progressoCalc = total === 0 ? 0 : Math.round((concluidas / total) * 100);
        return { ...p, progresso: progressoCalc };
      });
    },
    enabled: !!user,
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { 
        nome, 
        cliente_id: clienteId, 
        modelo, 
        valor: Number(valor), 
        inicio: inicio || null, 
        prazo: prazo || null,
        user_id: user!.id 
      };

      if (editingId) {
        const { data, error } = await supabase.from("projetos").update(payload).eq("id", editingId).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("projetos").insert([payload]).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      setOpen(false);
      toast.success(editingId ? "Projeto atualizado com sucesso" : "Projeto criado com sucesso");
      resetForm();
    },
    onError: (error) => {
      toast.error(editingId ? "Erro ao atualizar projeto" : "Erro ao criar projeto", { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projetos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir projeto", { description: error.message });
    }
  });

  const handleEdit = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(p.id);
    setNome(p.nome);
    setClienteId(p.cliente_id);
    setModelo(p.modelo);
    setValor(p.valor.toString());
    setInicio(p.inicio ? p.inicio.split("T")[0] : "");
    setPrazo(p.prazo ? p.prazo.split("T")[0] : "");
    setOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este projeto? O histórico de tarefas, faturas e horas será afetado (excluído ou desvinculado).")) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = useMemo(() => {
    return projetos.filter((p) => {
      const clienteNome = p.clientes?.nome || "";
      const matchesQ = p.nome.toLowerCase().includes(query.toLowerCase()) || clienteNome.toLowerCase().includes(query.toLowerCase());
      const matchesS = status === "todos" || p.status.toLowerCase() === status;
      return matchesQ && matchesS;
    });
  }, [projetos, query, status]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Projetos"
        description="Todos os projetos em andamento, pausados e concluídos."
        actions={
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" /> Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
                <DialogDescription>Preencha os dados do projeto.</DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="nome">Nome do projeto</Label>
                  <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Plataforma de Onboarding" required disabled={saveMutation.isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Cliente</Label>
                  <Select value={clienteId} onValueChange={setClienteId} disabled={saveMutation.isPending || loadingClientes}>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.empresa ? `${c.empresa} · ` : ''}{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Modelo de cobrança</Label>
                  <ToggleGroup disabled={saveMutation.isPending} type="single" value={modelo} onValueChange={(v) => v && setModelo(v as "Hora" | "Fixo")} className="justify-start">
                    <ToggleGroupItem value="Hora" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Por Hora</ToggleGroupItem>
                    <ToggleGroupItem value="Fixo" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Valor Fixo</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="valor">{modelo === "Hora" ? "Taxa/hora (R$)" : "Valor total (R$)"}</Label>
                    <Input id="valor" type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0" required disabled={saveMutation.isPending} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="inicio">Data de início</Label>
                    <Input id="inicio" type="date" value={inicio} onChange={e => setInicio(e.target.value)} disabled={saveMutation.isPending} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="prazo">Prazo final</Label>
                  <Input id="prazo" type="date" value={prazo} onChange={e => setPrazo(e.target.value)} disabled={saveMutation.isPending} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }} disabled={saveMutation.isPending}>Cancelar</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Salvar" : "Criar projeto"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar por nome ou cliente..." className="pl-9" />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="concluído">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingProjetos ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cobrança</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-48">Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="w-24 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">Nenhum projeto encontrado com esses filtros.</TableCell></TableRow>
                  ) : paginated.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{p.clientes?.nome}</TableCell>
                      <TableCell><Badge variant="outline">{p.modelo}</Badge></TableCell>
                      <TableCell>{p.modelo === "Hora" ? `${brl(p.valor)}/h` : brl(p.valor)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progresso} className="h-1.5" />
                          <span className="w-8 text-right text-xs text-muted-foreground">{p.progresso}%</span>
                        </div>
                      </TableCell>
                      <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusVariant(p.status)}`}>{p.status}</span></TableCell>
                      <TableCell className="text-muted-foreground">{p.prazo ? dataBR(p.prazo) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate({ to: `/projetos/$id`, params: { id: p.id } })}>
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handleEdit(p, e)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => handleDelete(p.id, e)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {paginated.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Nenhum projeto encontrado.</div>
              ) : paginated.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.clientes?.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusVariant(p.status)}`}>{p.status}</span>
                      <div className="flex items-center gap-1 -mr-2">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate({ to: `/projetos/$id`, params: { id: p.id } })}>
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEdit(p, e)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => handleDelete(p.id, e)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{p.modelo}</Badge>
                    <span>{p.modelo === "Hora" ? `${brl(p.valor)}/h` : brl(p.valor)}</span>
                    <span className="text-muted-foreground">· prazo {p.prazo ? dataBR(p.prazo) : "—"}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={p.progresso} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{p.progresso}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Mostrando {paginated.length} de {filtered.length}</p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, page - 1)); }} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, page + 1)); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </Card>
    </AppLayout>
  );
}
