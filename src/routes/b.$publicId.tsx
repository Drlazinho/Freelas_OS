import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { BriefingChat } from "@/components/briefing-chat";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Layers,
  CalendarDays,
  Wallet,
  MessageCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/b/$publicId")({
  head: () => ({
    meta: [
      { title: "Proposta de Projeto" },
      {
        name: "description",
        content: "Visualize a proposta completa do projeto.",
      },
    ],
  }),
  component: BriefingPublico,
});

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  Rascunho: {
    label: "Rascunho",
    icon: Clock,
    color: "text-zinc-400",
    bg: "bg-zinc-400/10 border-zinc-400/20",
  },
  Enviado: {
    label: "Aguardando Aprovação",
    icon: Clock,
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  Aprovado: {
    label: "Proposta Aprovada",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  Recusado: {
    label: "Proposta Recusada",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
};

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function BriefingPublico() {
  const { publicId } = Route.useParams();
  const queryClient = useQueryClient();
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: briefing, isLoading } = useQuery({
    queryKey: ["briefing_public", publicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefings")
        .select("*")
        .eq("public_id", publicId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("briefings")
        .update({ status: newStatus })
        .eq("public_id", publicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["briefing_public", publicId],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-white">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-zinc-400">
          Esta proposta não foi encontrada ou o link é inválido.
        </p>
      </div>
    );
  }

  const funcionalidades = (briefing.funcionalidades as any[]) || [];
  const fases = (briefing.fases as any[]) || [];
  const tecnologias = (briefing.tecnologias as string[]) || [];
  const cfg = statusConfig[briefing.status] || statusConfig.Enviado;
  const StatusIcon = cfg.icon;

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-violet-500/30">
      {/* Ambient glow effects */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(800px 400px at 20% 10%, rgba(139,92,246,0.08), transparent), radial-gradient(600px 300px at 80% 80%, rgba(59,130,246,0.06), transparent)",
        }}
      />

      {/* Hero */}
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <AnimatedSection>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {cfg.label}
              </span>
              {briefing.tipo && (
                <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {briefing.tipo}
                </span>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              {briefing.nome}
            </h1>
          </AnimatedSection>

          {briefing.descricao && (
            <AnimatedSection delay={200}>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
                {briefing.descricao}
              </p>
            </AnimatedSection>
          )}

          {tecnologias.length > 0 && (
            <AnimatedSection delay={300}>
              <div className="mt-8 flex flex-wrap gap-2">
                {tecnologias.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </AnimatedSection>
          )}

          <AnimatedSection delay={400}>
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={scrollToChat}
                className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-violet-400 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Ir para comentários</span>
                <ChevronDown className="h-3 w-3 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </AnimatedSection>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-16 space-y-20">
        {/* Funcionalidades */}
        {funcionalidades.length > 0 && (
          <section>
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Funcionalidades</h2>
                  <p className="text-sm text-zinc-500">
                    O que será desenvolvido neste projeto
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid gap-4 sm:grid-cols-2">
              {funcionalidades.map((f: any, i: number) => (
                <AnimatedSection key={i} delay={i * 80}>
                  <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.03]">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-400 text-xs font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100">
                            {f.titulo}
                          </h3>
                          {f.descricao && (
                            <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
                              {f.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>
        )}

        {/* Incluso / Não incluso */}
        {(briefing.incluso || briefing.nao_incluso) && (
          <section>
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Escopo</h2>
                  <p className="text-sm text-zinc-500">
                    O que está e o que não está incluído
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid gap-4 sm:grid-cols-2">
              {briefing.incluso && (
                <AnimatedSection delay={100}>
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-6">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Incluso
                    </h3>
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {briefing.incluso}
                    </div>
                  </div>
                </AnimatedSection>
              )}
              {briefing.nao_incluso && (
                <AnimatedSection delay={200}>
                  <div className="rounded-2xl border border-rose-500/10 bg-rose-500/[0.03] p-6">
                    <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Não incluso
                    </h3>
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {briefing.nao_incluso}
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </section>
        )}

        {/* Fases / Timeline */}
        {fases.length > 0 && (
          <section>
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Planejamento</h2>
                  <p className="text-sm text-zinc-500">
                    Fases do projeto e prazos estimados
                    {briefing.prazo_total && (
                      <span className="ml-2 text-zinc-300 font-medium">
                        · {briefing.prazo_total}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="relative ml-5">
              {/* Timeline line */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/40 via-blue-500/40 to-transparent" />

              <div className="space-y-6">
                {fases.map((f: any, i: number) => (
                  <AnimatedSection key={i} delay={i * 120}>
                    <div className="relative flex gap-6 pl-8">
                      {/* Dot */}
                      <div className="absolute left-0 top-2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-violet-400 bg-[#0a0a0f]" />

                      <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-zinc-100">
                              {f.nome}
                            </h3>
                            {f.descricao && (
                              <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
                                {f.descricao}
                              </p>
                            )}
                          </div>
                          {f.prazo_dias > 0 && (
                            <span className="shrink-0 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                              {f.prazo_dias} dias
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Investimento */}
        {briefing.valor > 0 && (
          <section>
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Investimento</h2>
                  <p className="text-sm text-zinc-500">
                    Valores e condições de pagamento
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.05] via-transparent to-blue-500/[0.05]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjxwYXRoIGQ9Ik0wIDBoMHY2MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />

                <div className="relative p-8 sm:p-10">
                  <div className="text-center mb-8">
                    <p className="text-sm text-zinc-500 mb-2">
                      {briefing.modelo === "Hora"
                        ? "Taxa por hora"
                        : "Valor total do projeto"}
                    </p>
                    <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                      {brl(Number(briefing.valor))}
                      {briefing.modelo === "Hora" && (
                        <span className="text-2xl text-zinc-500">/h</span>
                      )}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
                    {briefing.condicoes_pagamento && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                        <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                          Condições
                        </p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          {briefing.condicoes_pagamento}
                        </p>
                      </div>
                    )}
                    {briefing.validade_proposta && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                        <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                          Validade
                        </p>
                        <p className="text-sm text-zinc-300">
                          Até{" "}
                          {new Date(
                            briefing.validade_proposta + "T00:00:00",
                          ).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </section>
        )}

        {/* Observações */}
        {briefing.observacoes && (
          <AnimatedSection>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Observações
              </h3>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {briefing.observacoes}
              </p>
            </div>
          </AnimatedSection>
        )}

        {/* Ações do cliente */}
        {briefing.status === "Enviado" && (
          <AnimatedSection>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-8 text-center">
              <h3 className="text-xl font-bold">O que achou da proposta?</h3>
              <p className="text-sm text-zinc-400 max-w-md">
                Ao aprovar, sinalizamos o início do projeto. Se tiver dúvidas,
                use o chat abaixo antes de decidir.
              </p>
              <div className="flex gap-3 mt-2">
                <Button
                  onClick={() => statusMutation.mutate("Aprovado")}
                  disabled={statusMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-8"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Aprovar Proposta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => statusMutation.mutate("Recusado")}
                  disabled={statusMutation.isPending}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Recusar
                </Button>
              </div>
            </div>
          </AnimatedSection>
        )}

        {(briefing.status === "Aprovado" ||
          briefing.status === "Recusado") && (
          <AnimatedSection>
            <div
              className={`flex items-center justify-center gap-3 rounded-2xl border p-6 ${cfg.bg}`}
            >
              <StatusIcon className={`h-6 w-6 ${cfg.color}`} />
              <span className={`text-lg font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
          </AnimatedSection>
        )}

        {/* Chat */}
        <section ref={chatRef}>
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Comentários</h2>
                <p className="text-sm text-zinc-500">
                  Tire dúvidas sobre a proposta
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <BriefingChat briefingId={briefing.id} autorTipo="cliente" />
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-xs text-zinc-600">
          Proposta gerada via{" "}
          <span className="font-medium text-zinc-500">Freela.OS</span>
          {briefing.created_at && (
            <span>
              {" "}
              ·{" "}
              {new Date(briefing.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}
