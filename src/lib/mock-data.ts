export type Cliente = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  projetos: number;
};

export type Projeto = {
  id: string;
  nome: string;
  cliente: string;
  modelo: "Hora" | "Fixo";
  valor: number;
  progresso: number;
  status: "Ativo" | "Pausado" | "Concluído";
  inicio: string;
  prazo: string;
};

export type Tarefa = {
  id: string;
  titulo: string;
  projeto: string;
  estimativa: string;
  status: "Backlog" | "A Fazer" | "Em Progresso" | "Validação" | "Concluído";
};

export type Fatura = {
  id: string;
  cliente: string;
  projeto: string;
  valor: number;
  vencimento: string;
  status: "Pago" | "Aguardando" | "Atrasado";
};

export type TimesheetEntry = {
  id: string;
  projetoId: string;
  data: string; // no formato DD/MM
  descricao: string;
  horas: number;
};

export const clientes: Cliente[] = [
  { id: "c1", nome: "Ana Prado", empresa: "Loomi Studio", email: "ana@loomi.co", telefone: "(11) 98123-4001", projetos: 3 },
  { id: "c2", nome: "Bruno Sato", empresa: "Northwind Tech", email: "bruno@northwind.io", telefone: "(21) 99876-2210", projetos: 2 },
  { id: "c3", nome: "Carla Menezes", empresa: "Vela Digital", email: "carla@vela.digital", telefone: "(31) 98555-7788", projetos: 1 },
  { id: "c4", nome: "Diego Farias", empresa: "Kova Labs", email: "diego@kova.dev", telefone: "(11) 97444-3322", projetos: 4 },
  { id: "c5", nome: "Elisa Ramos", empresa: "Portico Health", email: "elisa@portico.health", telefone: "(41) 98211-9090", projetos: 2 },
  { id: "c6", nome: "Felipe Duarte", empresa: "Orbita Fintech", email: "felipe@orbita.fin", telefone: "(11) 96500-1122", projetos: 1 },
];

export const projetos: Projeto[] = [
  { id: "p1", nome: "Plataforma de Onboarding", cliente: "Loomi Studio", modelo: "Hora", valor: 180, progresso: 72, status: "Ativo", inicio: "2026-04-10", prazo: "2026-08-15" },
  { id: "p2", nome: "App de Delivery B2B", cliente: "Northwind Tech", modelo: "Fixo", valor: 48000, progresso: 40, status: "Ativo", inicio: "2026-05-02", prazo: "2026-09-30" },
  { id: "p3", nome: "Redesign Site Institucional", cliente: "Vela Digital", modelo: "Fixo", valor: 12500, progresso: 100, status: "Concluído", inicio: "2026-02-01", prazo: "2026-06-01" },
  { id: "p4", nome: "Dashboard Analytics", cliente: "Kova Labs", modelo: "Hora", valor: 210, progresso: 55, status: "Ativo", inicio: "2026-06-01", prazo: "2026-10-10" },
  { id: "p5", nome: "API de Prontuário", cliente: "Portico Health", modelo: "Fixo", valor: 65000, progresso: 20, status: "Pausado", inicio: "2026-05-20", prazo: "2026-12-01" },
  { id: "p6", nome: "Integração Pix", cliente: "Orbita Fintech", modelo: "Hora", valor: 250, progresso: 88, status: "Ativo", inicio: "2026-06-15", prazo: "2026-08-01" },
  { id: "p7", nome: "Sistema Interno RH", cliente: "Kova Labs", modelo: "Fixo", valor: 32000, progresso: 10, status: "Ativo", inicio: "2026-07-01", prazo: "2026-11-30" },
];

export const tarefas: Tarefa[] = [
  { id: "t1", titulo: "Modelar schema de usuários", projeto: "Onboarding", estimativa: "4h", status: "Backlog" },
  { id: "t2", titulo: "Pesquisa de referências visuais", projeto: "Delivery B2B", estimativa: "2h", status: "Backlog" },
  { id: "t3", titulo: "Configurar CI/CD", projeto: "Dashboard", estimativa: "3h", status: "A Fazer" },
  { id: "t4", titulo: "Criar componentes de formulário", projeto: "Onboarding", estimativa: "6h", status: "A Fazer" },
  { id: "t5", titulo: "Implementar autenticação OAuth", projeto: "Dashboard", estimativa: "8h", status: "Em Progresso" },
  { id: "t6", titulo: "Endpoint de webhook Pix", projeto: "Integração Pix", estimativa: "5h", status: "Em Progresso" },
  { id: "t7", titulo: "Ajustes de responsividade", projeto: "Site Institucional", estimativa: "3h", status: "Validação" },
  { id: "t8", titulo: "Revisão de acessibilidade", projeto: "Delivery B2B", estimativa: "2h", status: "Validação" },
  { id: "t9", titulo: "Deploy versão beta", projeto: "Integração Pix", estimativa: "1h", status: "Concluído" },
  { id: "t10", titulo: "Documentação da API", projeto: "Dashboard", estimativa: "4h", status: "Concluído" },
];

export const faturas: Fatura[] = [
  { id: "f1", cliente: "Loomi Studio", projeto: "Plataforma de Onboarding", valor: 8400, vencimento: "2026-07-30", status: "Aguardando" },
  { id: "f2", cliente: "Northwind Tech", projeto: "App de Delivery B2B", valor: 19200, vencimento: "2026-07-15", status: "Pago" },
  { id: "f3", cliente: "Vela Digital", projeto: "Redesign Site", valor: 12500, vencimento: "2026-06-10", status: "Pago" },
  { id: "f4", cliente: "Kova Labs", projeto: "Dashboard Analytics", valor: 9450, vencimento: "2026-07-05", status: "Atrasado" },
  { id: "f5", cliente: "Portico Health", projeto: "API de Prontuário", valor: 13000, vencimento: "2026-08-20", status: "Aguardando" },
  { id: "f6", cliente: "Orbita Fintech", projeto: "Integração Pix", valor: 5500, vencimento: "2026-07-01", status: "Atrasado" },
  { id: "f7", cliente: "Kova Labs", projeto: "Sistema Interno RH", valor: 6400, vencimento: "2026-08-30", status: "Aguardando" },
];

export const timesheet: TimesheetEntry[] = [
  { id: "ts1", projetoId: "p1", data: "08/07", descricao: "Redirecionamento de Link e testes", horas: 1 },
  { id: "ts2", projetoId: "p1", data: "10/07", descricao: "Reajuste e testes a gerenciamento de paletas", horas: 4 },
  { id: "ts3", projetoId: "p1", data: "13/07", descricao: "Integração Upgrade de Cores e recriação do novo layout", horas: 12 },
  { id: "ts4", projetoId: "p1", data: "14/07", descricao: "Integração de Decision e Ajustes a seleção de cores", horas: 2 },
  { id: "ts5", projetoId: "p1", data: "15/07", descricao: "Testes Finais e Correções de funcionalidade com melhorias", horas: 7 },
  { id: "ts6", projetoId: "p1", data: "16/07", descricao: "Campanhas Ativas e Rotas dinamicas", horas: 4 },
];

export const faturamentoMensal = [
  { mes: "Fev", faturamento: 14200, horas: 92 },
  { mes: "Mar", faturamento: 18700, horas: 108 },
  { mes: "Abr", faturamento: 22100, horas: 124 },
  { mes: "Mai", faturamento: 19800, horas: 115 },
  { mes: "Jun", faturamento: 26400, horas: 138 },
  { mes: "Jul", faturamento: 31250, horas: 152 },
];

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const dataBR = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
