import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/app-layout";
import { KanbanBoard } from "@/components/kanban-board";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas · Freela.OS" },
      { name: "description", content: "Quadro Kanban das suas tarefas por status." },
    ],
  }),
  component: TarefasPage,
});

function TarefasPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Tarefas"
        description="Organize seu fluxo de trabalho arrastando entre colunas."
      />
      <KanbanBoard />
    </AppLayout>
  );
}
