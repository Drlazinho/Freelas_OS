import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Comentario = {
  id: string;
  briefing_id: string;
  autor_tipo: "freelancer" | "cliente";
  autor_nome: string;
  mensagem: string;
  created_at: string | null;
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

export function BriefingChat({
  briefingId,
  autorTipo,
  autorNome: initialAutorNome,
}: {
  briefingId: string;
  autorTipo: "freelancer" | "cliente";
  autorNome?: string;
}) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mensagem, setMensagem] = useState("");
  const [clienteNome, setClienteNome] = useState(() => {
    if (autorTipo === "freelancer") return initialAutorNome || "";
    if (typeof window !== "undefined") {
      return localStorage.getItem(`briefing_chat_nome_${briefingId}`) || "";
    }
    return "";
  });
  const [clienteNomeConfirmed, setClienteNomeConfirmed] = useState(() => {
    if (autorTipo === "freelancer") return true;
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(`briefing_chat_nome_${briefingId}`);
    }
    return false;
  });

  const autorNome = autorTipo === "freelancer" ? (initialAutorNome || "Freelancer") : clienteNome;

  const { data: comentarios = [], isLoading } = useQuery({
    queryKey: ["briefing_comentarios", briefingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefing_comentarios")
        .select("*")
        .eq("briefing_id", briefingId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comentario[];
    },
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("briefing_comentarios").insert([
        {
          briefing_id: briefingId,
          autor_tipo: autorTipo,
          autor_nome: autorNome,
          mensagem: mensagem.trim(),
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      setMensagem("");
      queryClient.invalidateQueries({
        queryKey: ["briefing_comentarios", briefingId],
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comentarios]);

  const handleConfirmNome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) return;
    localStorage.setItem(`briefing_chat_nome_${briefingId}`, clienteNome.trim());
    setClienteNomeConfirmed(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) return;
    sendMutation.mutate();
  };

  // Prompt for client name if not yet confirmed
  if (autorTipo === "cliente" && !clienteNomeConfirmed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>Para participar da conversa, informe seu nome:</span>
        </div>
        <form onSubmit={handleConfirmNome} className="flex gap-2">
          <Input
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Seu nome..."
            className="flex-1"
            required
          />
          <Button type="submit" size="sm">Entrar no chat</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 p-4 max-h-[400px] min-h-[200px]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comentarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Inicie a conversa sobre este briefing.
            </p>
          </div>
        ) : (
          comentarios.map((c) => {
            const isMe = c.autor_tipo === autorTipo;
            return (
              <div
                key={c.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    c.autor_tipo === "freelancer"
                      ? "bg-primary/15 text-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <p className="text-xs font-semibold mb-0.5 opacity-70">
                    {c.autor_nome}
                    <span className="ml-2 font-normal opacity-50">
                      {c.autor_tipo === "freelancer" ? "Profissional" : "Cliente"}
                    </span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{c.mensagem}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50 mt-1 px-2">
                  {timeAgo(c.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border p-3 bg-muted/30"
      >
        <Input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="flex-1"
          disabled={sendMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sendMutation.isPending || !mensagem.trim()}
          className="shrink-0"
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
