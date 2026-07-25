import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Play, Plus, Square, Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

const colunas = ["Backlog", "A Fazer", "Em Progresso", "Validação", "Concluído"];

const dotColor = (s: string) => {
  switch (s) {
    case "Backlog": return "bg-muted-foreground";
    case "A Fazer": return "bg-chart-2";
    case "Em Progresso": return "bg-primary";
    case "Validação": return "bg-warning";
    case "Concluído": return "bg-[color:var(--success)]";
    default: return "bg-muted-foreground";
  }
};

interface KanbanBoardProps {
  projectId?: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTimers, setActiveTimers] = useState<Set<number>>(new Set());
  
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [projetoId, setProjetoId] = useState(projectId || "");
  const [estimativa, setEstimativa] = useState("");

  const [editingTarefa, setEditingTarefa] = useState<any>(null);
  const [deletingTarefa, setDeletingTarefa] = useState<any>(null);

  const queryKey = projectId ? ["tarefas", "projeto", projectId] : ["tarefas", "all"];

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("tarefas")
        .select(`
          *,
          projetos ( nome )
        `)
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("projeto_id", projectId);
      }
      
      const { data, error } = await query;
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
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user && !projectId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("tarefas")
        .insert([{ 
          titulo, 
          projeto_id: projectId || (projetoId === "none" ? null : (projetoId || null)), 
          estimativa: estimativa ? Number(estimativa) : null,
          status: "Backlog",
          user_id: user!.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projeto", projectId] });
      
      setOpen(false);
      toast.success("Tarefa criada com sucesso");
      setTitulo("");
      if (!projectId) setProjetoId("");
      setEstimativa("");
    },
    onError: (error) => {
      toast.error("Erro ao criar tarefa", { description: error.message });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data, error } = await supabase
        .from("tarefas")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTarefas = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((t: any) => t.id === variables.id ? { ...t, status: variables.status } : t);
      });
      
      return { previousTarefas };
    },
    onError: (err, variables, context) => {
      if (context?.previousTarefas) {
        queryClient.setQueryData(queryKey, context.previousTarefas);
      }
      toast.error("Erro ao mover tarefa");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projeto", projectId] });
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const pId = projectId || (editingTarefa.projeto_id === "none" ? null : (editingTarefa.projeto_id || null));
      const { data, error } = await supabase
        .from("tarefas")
        .update({
          titulo: editingTarefa.titulo,
          projeto_id: pId,
          estimativa: editingTarefa.estimativa ? Number(editingTarefa.estimativa) : null,
        })
        .eq("id", editingTarefa.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projeto", projectId] });
      setEditingTarefa(null);
      toast.success("Tarefa atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa", { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tarefas")
        .delete()
        .eq("id", deletingTarefa.id);
      
      if (error) throw error;
      return deletingTarefa.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projeto", projectId] });
      setDeletingTarefa(null);
      toast.success("Tarefa excluída com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tarefa", { description: error.message });
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate();
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const destStatus = destination.droppableId;
    updateStatusMutation.mutate({ id: draggableId, status: destStatus });
  };

  const toggleTimer = (id: string, tTitulo: string) => {
    const numId = Number(id);
    setActiveTimers(prev => {
      const next = new Set(prev);
      if (next.has(numId)) {
        next.delete(numId);
        toast(`Cronômetro parado: ${tTitulo}`);
      } else {
        next.add(numId);
        toast.success(`Cronômetro iniciado: ${tTitulo}`);
      }
      return next;
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        {projectId ? <div></div> : <div></div>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Título</Label>
                <Input required value={titulo} onChange={e => setTitulo(e.target.value)} disabled={createMutation.isPending} />
              </div>
              
              {!projectId && (
                <div className="grid gap-1.5">
                  <Label>Projeto (opcional)</Label>
                  <Select value={projetoId} onValueChange={setProjetoId} disabled={createMutation.isPending || loadingProjetos}>
                    <SelectTrigger><SelectValue placeholder="Sem projeto vinculado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem projeto</SelectItem>
                      {projetos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label>Estimativa (horas)</Label>
                <Input type="number" step="0.5" placeholder="Ex: 2.5" value={estimativa} onChange={e => setEstimativa(e.target.value)} disabled={createMutation.isPending} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={createMutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Tarefa
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingTarefa} onOpenChange={(val) => !val && setEditingTarefa(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Tarefa</DialogTitle></DialogHeader>
          {editingTarefa && (
            <form onSubmit={submitEdit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Título</Label>
                <Input required value={editingTarefa.titulo} onChange={e => setEditingTarefa({...editingTarefa, titulo: e.target.value})} disabled={editMutation.isPending} />
              </div>
              
              {!projectId && (
                <div className="grid gap-1.5">
                  <Label>Projeto (opcional)</Label>
                  <Select value={editingTarefa.projeto_id || "none"} onValueChange={(val) => setEditingTarefa({...editingTarefa, projeto_id: val})} disabled={editMutation.isPending || loadingProjetos}>
                    <SelectTrigger><SelectValue placeholder="Sem projeto vinculado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem projeto</SelectItem>
                      {projetos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label>Estimativa (horas)</Label>
                <Input type="number" step="0.5" value={editingTarefa.estimativa || ""} onChange={e => setEditingTarefa({...editingTarefa, estimativa: e.target.value})} disabled={editMutation.isPending} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingTarefa(null)} disabled={editMutation.isPending}>Cancelar</Button>
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTarefa} onOpenChange={(val) => !val && setDeletingTarefa(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Tarefa</DialogTitle></DialogHeader>
          <div className="py-4 text-muted-foreground">
            Tem certeza que deseja excluir a tarefa <strong>{deletingTarefa?.titulo}</strong>?
            Esta ação não pode ser desfeita.
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletingTarefa(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="-mx-4 overflow-x-auto pb-4 sm:mx-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex min-w-max gap-4 px-4 sm:px-0 sm:grid sm:grid-cols-2 sm:min-w-0 lg:grid-cols-5">
            {colunas.map((col) => {
              const itens = tarefas.filter((t: any) => t.status === col);
              return (
                <div key={col} className="w-72 shrink-0 sm:w-auto">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dotColor(col)}`} />
                      <h3 className="text-sm font-semibold">{col}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{itens.length}</span>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-2">
                       {Array.from({ length: col === "Backlog" || col === "Em Progresso" ? 2 : 1 }).map((_, i) => (
                         <div key={i} className="rounded-xl border border-border bg-card p-3">
                           <Skeleton className="h-4 w-3/4 mb-3" />
                           <div className="flex justify-between gap-2 mb-2">
                             <Skeleton className="h-4 w-16" />
                             <Skeleton className="h-4 w-12" />
                           </div>
                           <div className="flex justify-end">
                             <Skeleton className="h-6 w-16" />
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <Droppable droppableId={col}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className={`space-y-2 min-h-[150px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                        >
                          {itens.length === 0 && !snapshot.isDraggingOver && (
                            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                              Sem tarefas
                            </div>
                          )}
                          {itens.map((t: any, index: number) => {
                            const isTimerActive = activeTimers.has(Number(t.id));
                            return (
                              <Draggable key={t.id.toString()} draggableId={t.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <Card 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`group relative p-3 transition-all ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-medium leading-snug">{t.titulo}</p>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => setEditingTarefa(t)}>
                                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setDeletingTarefa(t)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2">
                                      {t.projetos?.nome && !projectId && (
                                        <Badge variant="outline" className="max-w-[70%] truncate text-[10px]">{t.projetos.nome}</Badge>
                                      )}
                                      {(!t.projetos?.nome || projectId) && <div />}
                                      {t.estimativa != null && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                          <Clock className="h-3 w-3" /> {t.estimativa}h
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 flex items-center justify-end">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`h-7 gap-1 px-2 text-xs ${isTimerActive ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-primary'}`}
                                        onClick={() => toggleTimer(t.id, t.titulo)}
                                      >
                                        {isTimerActive ? (
                                          <><Square className="h-3 w-3 fill-current" /> Parar</>
                                        ) : (
                                          <><Play className="h-3 w-3 fill-current" /> Iniciar</>
                                        )}
                                      </Button>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </>
  );
}
