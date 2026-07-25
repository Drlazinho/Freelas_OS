import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Phone, Plus, Building2, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · Freela.OS" },
      { name: "description", content: "Sua base de clientes e contatos." },
    ],
  }),
  component: ClientesPage,
});

const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

function ClientesPage() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form for creation
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Edit / Delete state
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingClient, setDeletingClient] = useState<any>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select(`
          *,
          projetos ( count )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .insert([{ nome, empresa, email, telefone, user_id: user!.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setOpen(false);
      toast.success("Cliente cadastrado com sucesso");
      setNome(""); setEmpresa(""); setEmail(""); setTelefone("");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente", { description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .update({
          nome: editingClient.nome,
          empresa: editingClient.empresa,
          email: editingClient.email,
          telefone: editingClient.telefone
        })
        .eq("id", editingClient.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setEditingClient(null);
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente", { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", deletingClient.id);
      
      if (error) throw error;
      return deletingClient.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setDeletingClient(null);
      toast.success("Cliente excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir cliente", { description: error.message });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const openEdit = (c: any) => {
    setEditingClient({ ...c });
  };

  return (
    <AppLayout>
      <PageHeader
        title="Clientes"
        description="Todos os seus clientes ativos e o histórico de projetos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label>Nome do contato</Label>
                  <Input required value={nome} onChange={e => setNome(e.target.value)} disabled={createMutation.isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Empresa</Label>
                  <Input value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={createMutation.isPending} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={createMutation.isPending} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Telefone</Label>
                    <Input value={telefone} onChange={e => setTelefone(e.target.value)} disabled={createMutation.isPending} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={createMutation.isPending}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(val) => !val && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {editingClient && (
            <form onSubmit={submitEdit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Nome do contato</Label>
                <Input required value={editingClient.nome || ""} onChange={e => setEditingClient({ ...editingClient, nome: e.target.value })} disabled={updateMutation.isPending} />
              </div>
              <div className="grid gap-1.5">
                <Label>Empresa</Label>
                <Input value={editingClient.empresa || ""} onChange={e => setEditingClient({ ...editingClient, empresa: e.target.value })} disabled={updateMutation.isPending} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={editingClient.email || ""} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} disabled={updateMutation.isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Telefone</Label>
                  <Input value={editingClient.telefone || ""} onChange={e => setEditingClient({ ...editingClient, telefone: e.target.value })} disabled={updateMutation.isPending} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingClient(null)} disabled={updateMutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingClient} onOpenChange={(val) => !val && setDeletingClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Cliente</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground">
            Tem certeza que deseja excluir o cliente <strong>{deletingClient?.nome}</strong>?
            <br />
            Essa ação não pode ser desfeita e pode afetar os projetos relacionados.
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletingClient(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground">
          <p>Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <Card key={c.id} className="transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary font-semibold">{initials(c.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {c.empresa || "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{c.projetos?.[0]?.count || 0} proj.</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setDeletingClient(c)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.email || "—"}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {c.telefone || "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
