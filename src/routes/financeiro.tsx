import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import { Search, Download, ArrowDownRight, ArrowUpRight, Wallet, Plus, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { brl, dataBR } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro · Freela.OS" },
      { name: "description", content: "Acompanhe faturas, pagamentos e valores em aberto." },
    ],
  }),
  component: FinanceiroPage,
});

const statusBadge = (s: string) => {
  if (s === "Pago") return "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] border border-[oklch(var(--success)/0.3)]";
  if (s === "Aguardando") return "bg-warning/15 text-warning border border-warning/30";
  return "bg-destructive/15 text-destructive border border-destructive/30";
};

function FinanceiroPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Create state
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [statusFatura, setStatusFatura] = useState("Aguardando");

  // Edit / Delete State
  const [editingFatura, setEditingFatura] = useState<any>(null);
  const [deletingFatura, setDeletingFatura] = useState<any>(null);

  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ["faturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select(`
          *,
          clientes ( nome ),
          projetos ( nome )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projetos = [], isLoading: loadingProjetos } = useQuery({
    queryKey: ["projetos_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("id, nome, cliente_id")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .insert([{ 
          cliente_id: clienteId, 
          projeto_id: projetoId === "none" ? null : projetoId, 
          valor: Number(valor), 
          vencimento,
          status: statusFatura,
          user_id: user!.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      setOpen(false);
      toast.success("Fatura criada com sucesso");
      setClienteId(""); setProjetoId(""); setValor(""); setVencimento(""); setStatusFatura("Aguardando");
    },
    onError: (error) => {
      toast.error("Erro ao criar fatura", { description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .update({
          cliente_id: editingFatura.cliente_id,
          projeto_id: editingFatura.projeto_id === "none" ? null : editingFatura.projeto_id,
          valor: Number(editingFatura.valor),
          vencimento: editingFatura.vencimento,
          status: editingFatura.status
        })
        .eq("id", editingFatura.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      setEditingFatura(null);
      toast.success("Fatura atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar fatura", { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("faturas")
        .delete()
        .eq("id", deletingFatura.id);
      
      if (error) throw error;
      return deletingFatura.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      setDeletingFatura(null);
      toast.success("Fatura excluída com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir fatura", { description: error.message });
    }
  });

  const totalRecebido = faturas.filter((f) => f.status === "Pago").reduce((a, b) => a + Number(b.valor), 0);
  const totalAguard = faturas.filter((f) => f.status === "Aguardando").reduce((a, b) => a + Number(b.valor), 0);
  const totalAtras = faturas.filter((f) => f.status === "Atrasado").reduce((a, b) => a + Number(b.valor), 0);

  const filtered = useMemo(() =>
    faturas.filter((f) => {
      const clienteNome = f.clientes?.nome || "";
      const projetoNome = f.projetos?.nome || "";
      const matchQ = clienteNome.toLowerCase().includes(q.toLowerCase()) || projetoNome.toLowerCase().includes(q.toLowerCase());
      const matchS = statusFilter === "todos" || f.status.toLowerCase() === statusFilter;
      return matchQ && matchS;
    })
  , [faturas, q, statusFilter]);

  const metrics = [
    { label: "Total Recebido", value: brl(totalRecebido), icon: ArrowDownRight, tone: "text-[color:var(--success)]" },
    { label: "A Receber", value: brl(totalAguard), icon: Wallet, tone: "text-warning" },
    { label: "Em Atraso", value: brl(totalAtras), icon: ArrowUpRight, tone: "text-destructive" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    createMutation.mutate();
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFatura.cliente_id) {
      toast.error("Selecione um cliente");
      return;
    }
    updateMutation.mutate();
  };

  const projetosDoCliente = (cId: string) => projetos.filter((p: any) => p.cliente_id === cId);

  return (
    <AppLayout>
      <PageHeader
        title="Financeiro"
        description="Faturas, recebimentos e valores em aberto."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.success("Relatório exportado")}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label>Cliente</Label>
                    <Select value={clienteId} onValueChange={setClienteId} disabled={createMutation.isPending || loadingClientes}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>
                        {clientes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Projeto (Opcional)</Label>
                    <Select value={projetoId} onValueChange={setProjetoId} disabled={createMutation.isPending || !clienteId || loadingProjetos}>
                      <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum projeto</SelectItem>
                        {projetosDoCliente(clienteId).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Valor (R$)</Label>
                      <Input type="number" required value={valor} onChange={e => setValor(e.target.value)} disabled={createMutation.isPending} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Vencimento</Label>
                      <Input type="date" required value={vencimento} onChange={e => setVencimento(e.target.value)} disabled={createMutation.isPending} />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={statusFatura} onValueChange={setStatusFatura} disabled={createMutation.isPending}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={createMutation.isPending}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Fatura
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{m.value}</p>
              </div>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted ${m.tone}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingFatura} onOpenChange={(val) => !val && setEditingFatura(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Fatura</DialogTitle></DialogHeader>
          {editingFatura && (
            <form onSubmit={submitEdit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Cliente</Label>
                <Select value={editingFatura.cliente_id} onValueChange={(val) => setEditingFatura({ ...editingFatura, cliente_id: val })} disabled={updateMutation.isPending || loadingClientes}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Projeto (Opcional)</Label>
                <Select value={editingFatura.projeto_id || "none"} onValueChange={(val) => setEditingFatura({ ...editingFatura, projeto_id: val })} disabled={updateMutation.isPending || loadingProjetos}>
                  <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projetosDoCliente(editingFatura.cliente_id).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" required value={editingFatura.valor} onChange={e => setEditingFatura({ ...editingFatura, valor: e.target.value })} disabled={updateMutation.isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Vencimento</Label>
                  <Input type="date" required value={editingFatura.vencimento} onChange={e => setEditingFatura({ ...editingFatura, vencimento: e.target.value })} disabled={updateMutation.isPending} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={editingFatura.status} onValueChange={(val) => setEditingFatura({ ...editingFatura, status: val })} disabled={updateMutation.isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingFatura(null)} disabled={updateMutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingFatura} onOpenChange={(val) => !val && setDeletingFatura(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Fatura</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground">
            Tem certeza que deseja excluir esta fatura no valor de <strong>{deletingFatura ? brl(deletingFatura.valor) : ''}</strong>?
            Essa ação não pode ser desfeita.
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletingFatura(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente ou projeto..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Cliente</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">Nenhuma fatura encontrada.</TableCell></TableRow>
              ) : filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.clientes?.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{f.projetos?.nome || "—"}</TableCell>
                  <TableCell>{brl(f.valor)}</TableCell>
                  <TableCell className="text-muted-foreground">{dataBR(f.vencimento)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(f.status)}`}>{f.status}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingFatura(f)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setDeletingFatura(f)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppLayout>
  );
}
