import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Link2,
  FileText,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { dataBR } from "@/lib/mock-data";

export const Route = createFileRoute("/briefings")(
  {
    head: () => ({
      meta: [
        { title: "Briefings · Freela.OS" },
        {
          name: "description",
          content: "Crie e gerencie briefings de projetos para seus clientes.",
        },
      ],
    }),
    component: BriefingsPage,
  },
);

const statusConfig: Record<string, { label: string; className: string }> = {
  Rascunho: {
    label: "Rascunho",
    className:
      "bg-muted text-muted-foreground border border-border",
  },
  Enviado: {
    label: "Enviado",
    className:
      "bg-primary/15 text-primary border border-primary/30",
  },
  Aprovado: {
    label: "Aprovado",
    className:
      "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)] border border-[oklch(var(--success)/0.3)]",
  },
  Recusado: {
    label: "Recusado",
    className:
      "bg-destructive/15 text-destructive border border-destructive/30",
  },
};

function BriefingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);

  // New briefing form
  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const resetForm = () => {
    setNome("");
    setClienteId("");
    setTemplateId("");
  };

  const { data: briefings = [], isLoading } = useQuery({
    queryKey: ["briefings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefings")
        .select(
          `
          *,
          clientes ( nome, empresa )
        `,
        )
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
        .select("id, nome, empresa")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["briefing_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefing_templates")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let insertData: any = {
        nome,
        cliente_id: clienteId || null,
        user_id: user!.id,
      };

      if (templateId) {
        const tpl = templates.find((t: any) => t.id === templateId);
        if (tpl) {
          insertData = {
            ...insertData,
            descricao: tpl.descricao,
            tipo: tpl.tipo,
            tecnologias: tpl.tecnologias,
            funcionalidades: tpl.funcionalidades,
            incluso: tpl.incluso,
            nao_incluso: tpl.nao_incluso,
            fases: tpl.fases,
            modelo: tpl.modelo,
            valor: tpl.valor,
            condicoes_pagamento: tpl.condicoes_pagamento,
            observacoes: tpl.observacoes,
          };
        }
      }

      const { data, error } = await supabase
        .from("briefings")
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      setOpen(false);
      resetForm();
      toast.success("Briefing criado com sucesso");
      navigate({ to: "/briefings/$id", params: { id: data.id } });
    },
    onError: (error) => {
      toast.error("Erro ao criar briefing", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("briefings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      toast.success("Briefing excluído");
    },
    onError: (error) => {
      toast.error("Erro ao excluir", { description: error.message });
    },
  });

  const markAsEnviado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("briefings")
        .update({ status: "Enviado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
      toast.success("Briefing marcado como Enviado");
    },
  });

  const handleCopyLink = (publicId: string) => {
    const url = `${window.location.origin}/b/${publicId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", {
      description: url,
    });
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este briefing? Esta ação não pode ser desfeita.",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = briefings.filter((b: any) => {
    const clienteNome = b.clientes?.nome || "";
    const matchesQ =
      b.nome.toLowerCase().includes(query.toLowerCase()) ||
      clienteNome.toLowerCase().includes(query.toLowerCase());
    const matchesS =
      statusFilter === "todos" || b.status === statusFilter;
    return matchesQ && matchesS;
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const tipoIcon: Record<string, string> = {
    Site: "🌐",
    App: "📱",
    Sistema: "💻",
    "Landing Page": "📄",
    API: "🔌",
  };

  return (
    <AppLayout>
      <PageHeader
        title="Briefings"
        description="Crie propostas profissionais e compartilhe com seus clientes."
        actions={
          <Dialog
            open={open}
            onOpenChange={(val) => {
              setOpen(val);
              if (!val) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Briefing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Briefing</DialogTitle>
                <DialogDescription>
                  Crie uma proposta para compartilhar com o cliente.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="briefing-nome">Nome do projeto</Label>
                  <Input
                    id="briefing-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Plataforma de Onboarding"
                    required
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Template (opcional)</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Começar do zero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhum (Começar do zero)</SelectItem>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Cliente (opcional)</Label>
                  <Select
                    value={clienteId}
                    onValueChange={setClienteId}
                    disabled={createMutation.isPending || loadingClientes}
                  >
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
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar briefing
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou cliente..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Rascunho">Rascunho</SelectItem>
            <SelectItem value="Enviado">Enviado</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground">
          <FileText className="h-8 w-8 mb-2 opacity-40" />
          <p>
            {briefings.length === 0
              ? "Nenhum briefing criado ainda."
              : "Nenhum briefing encontrado com esses filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b: any) => {
            const cfg = statusConfig[b.status] || statusConfig.Rascunho;
            return (
              <Card
                key={b.id}
                className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                onClick={() =>
                  navigate({
                    to: "/briefings/$id",
                    params: { id: b.id },
                  })
                }
              >
                {/* Top gradient accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {tipoIcon[b.tipo] || "📋"}
                        </span>
                        <p className="truncate font-semibold text-base">
                          {b.nome}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.clientes?.empresa
                          ? `${b.clientes.empresa} · `
                          : ""}
                        {b.clientes?.nome || "Sem cliente vinculado"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({
                                to: "/briefings/$id",
                                params: { id: b.id },
                              });
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(b.public_id);
                            }}
                          >
                            <Link2 className="mr-2 h-4 w-4" /> Copiar link
                          </DropdownMenuItem>
                          {b.status === "Rascunho" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsEnviado.mutate(b.id);
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" /> Marcar como
                              Enviado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(b.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                    {b.valor > 0 && (
                      <span className="font-medium text-foreground">
                        {Number(b.valor).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                    {b.tipo && (
                      <Badge variant="outline" className="text-[10px]">
                        {b.tipo}
                      </Badge>
                    )}
                    <span className="ml-auto">
                      {b.created_at ? dataBR(b.created_at.split("T")[0]) : ""}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
