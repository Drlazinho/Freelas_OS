import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  FolderKanban,
  ArrowUpRight,
  AlertTriangle,
  Play,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, dataBR } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Freela.OS" },
      { name: "description", content: "Visão geral do seu faturamento, horas e projetos ativos." },
    ],
  }),
  component: Dashboard,
});

function diasAte(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return diff;
}

function Dashboard() {
  const { user } = useAuth();
  
  // Apenas buscando dados gerais, de forma simplificada por enquanto.
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      // Paraleliza as requisições principais
      const [
        { data: faturas },
        { data: timesheet },
        { data: tarefas },
        { data: projetos },
        { data: profile }
      ] = await Promise.all([
        supabase.from("faturas").select("valor, status, vencimento"),
        supabase.from("timesheet_entries").select("horas, data"),
        supabase.from("tarefas").select("id, titulo, estimativa, status, projetos(nome)").eq("status", "Em Progresso"),
        supabase.from("projetos").select("id, nome, progresso, prazo, status, clientes(nome), tarefas(id, status)").neq("status", "Concluído").order("prazo").limit(4),
        supabase.from("profiles").select("nome").eq("id", user!.id).single()
      ]);

      const totalRecebido = faturas?.filter(f => f.status === "Pago").reduce((a, b) => a + Number(b.valor), 0) || 0;
      const totalAReceber = faturas?.filter(f => f.status === "Aguardando").reduce((a, b) => a + Number(b.valor), 0) || 0;
      const qtdeAReceber = faturas?.filter(f => f.status === "Aguardando").length || 0;
      
      const horasTotais = timesheet?.reduce((a, b) => a + Number(b.horas), 0) || 0;
      const projAtivos = projetos?.length || 0;

      // Agregação dos dados reais para os últimos 6 meses
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const faturamentoMensal = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const fatMes = faturas
          ?.filter(f => f.status === "Pago" && f.vencimento && f.vencimento.startsWith(yearMonth))
          .reduce((acc, f) => acc + Number(f.valor), 0) || 0;
          
        const horasMes = timesheet
          ?.filter(t => t.data && t.data.startsWith(yearMonth))
          .reduce((acc, t) => acc + Number(t.horas), 0) || 0;
          
        faturamentoMensal.push({
          mes: monthNames[d.getMonth()],
          faturamento: fatMes,
          horas: horasMes
        });
      }

      const prazosCalculados = (projetos || []).map((p: any) => {
        const total = p.tarefas?.length || 0;
        const concluidas = p.tarefas?.filter((t: any) => t.status === "Concluído").length || 0;
        const progressoCalc = total === 0 ? 0 : Math.round((concluidas / total) * 100);
        return { ...p, progresso: progressoCalc };
      });

      return {
        faturamentoMensal,
        metrics: [
          { label: "Faturamento do Mês", value: brl(totalRecebido), delta: "+18,4%", positive: true, icon: Wallet, sub: "vs. mês anterior" },
          { label: "Horas Trabalhadas", value: `${horasTotais}h`, delta: "+10,1%", positive: true, icon: Clock, sub: "julho / 2026" },
          { label: "Valor a Receber", value: brl(totalAReceber), delta: `${qtdeAReceber} faturas`, positive: false, icon: ArrowUpRight, sub: "abertas" },
          { label: "Projetos Ativos", value: projAtivos.toString(), delta: "+1 novo", positive: true, icon: FolderKanban, sub: "este mês" },
        ],
        emAndamento: tarefas || [],
        prazos: prazosCalculados,
        nome: profile?.nome || "Freelancer"
      };
    },
    enabled: !!user
  });

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description={`Bom te ver de novo, ${dashboardData?.nome ? dashboardData.nome.split(" ")[0] : "Freelancer"} — aqui está o resumo do seu mês.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : dashboardData?.metrics.map((m) => (
          <Card key={m.label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{m.value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                    m.positive
                      ? "bg-[oklch(var(--success)/0.15)] text-[color:var(--success)]"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {m.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.delta}
                </span>
                <span className="text-muted-foreground">{m.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Faturamento & Horas</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Últimos 6 meses</p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">Últimos 6 meses</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.faturamentoMensal} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(v: number, name) =>
                      name === "faturamento" ? [brl(v), "Faturamento"] : [`${v}h`, "Horas"]
                    }
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="var(--primary)" strokeWidth={2} fill="url(#gradFat)" />
                  <Area type="monotone" dataKey="horas" stroke="var(--chart-2)" strokeWidth={2} fill="url(#gradHoras)" />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas em Andamento</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{dashboardData?.emAndamento.length || 0} tarefas ativas</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                </div>
              ))
            ) : dashboardData?.emAndamento.length === 0 ? (
               <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa em andamento.</div>
            ) : dashboardData?.emAndamento.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.titulo}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] truncate max-w-[100px]">
                      {t.projetos?.nome || "Sem projeto"}
                    </Badge>
                    {t.estimativa != null && <span>{t.estimativa}h</span>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary" aria-label="Iniciar cronômetro">
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <div>
            <CardTitle>Prazos Próximos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Projetos com entrega mais próxima</p>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/projetos">Ver Todos</Link></Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-20 mt-1" />
                  <div className="mt-4">
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <div className="mt-2 flex justify-between">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : dashboardData?.prazos.length === 0 ? (
               <div className="col-span-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                 Nenhum prazo próximo.
               </div>
            ) : dashboardData?.prazos.map((p: any) => {
              const d = p.prazo ? diasAte(p.prazo) : 999;
              const isPronto = p.progresso === 100;
              const urgente = !isPronto && d <= 7;
              
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{p.nome}</p>
                    {isPronto && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(var(--success)/0.15)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--success)]">
                        Pronto
                      </span>
                    )}
                    {urgente && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Urgente
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.clientes?.nome || "Sem cliente"}</p>
                  <div className="mt-3">
                    <Progress value={p.progresso} className="h-1.5" />
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.progresso}%</span>
                      <span className={urgente ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {p.prazo ? `${dataBR(p.prazo)} · ${d}d` : "Sem prazo"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
