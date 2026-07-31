export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string | null
          avatar_url: string | null
          empresa: string | null
          documento: string | null
          dados_bancarios: Json | null
          notificacoes: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          nome?: string | null
          avatar_url?: string | null
          empresa?: string | null
          documento?: string | null
          dados_bancarios?: Json | null
          notificacoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          avatar_url?: string | null
          empresa?: string | null
          documento?: string | null
          dados_bancarios?: Json | null
          notificacoes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      clientes: {
        Row: {
          id: string
          user_id: string
          nome: string
          empresa: string | null
          email: string | null
          telefone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          empresa?: string | null
          email?: string | null
          telefone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          empresa?: string | null
          email?: string | null
          telefone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projetos: {
        Row: {
          id: string
          user_id: string
          cliente_id: string
          nome: string
          modelo: 'Hora' | 'Fixo'
          valor: number
          progresso: number
          status: 'Ativo' | 'Pausado' | 'Concluído' | 'Cancelado'
          inicio: string | null
          prazo: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          cliente_id: string
          nome: string
          modelo: 'Hora' | 'Fixo'
          valor?: number
          progresso?: number
          status?: 'Ativo' | 'Pausado' | 'Concluído' | 'Cancelado'
          inicio?: string | null
          prazo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          cliente_id?: string
          nome?: string
          modelo?: 'Hora' | 'Fixo'
          valor?: number
          progresso?: number
          status?: 'Ativo' | 'Pausado' | 'Concluído' | 'Cancelado'
          inicio?: string | null
          prazo?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tarefas: {
        Row: {
          id: string
          user_id: string
          projeto_id: string
          titulo: string
          estimativa: number | null
          status: 'Backlog' | 'A Fazer' | 'Em Progresso' | 'Validação' | 'Concluído'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          projeto_id: string
          titulo: string
          estimativa?: number | null
          status?: 'Backlog' | 'A Fazer' | 'Em Progresso' | 'Validação' | 'Concluído'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          projeto_id?: string
          titulo?: string
          estimativa?: number | null
          status?: 'Backlog' | 'A Fazer' | 'Em Progresso' | 'Validação' | 'Concluído'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      faturas: {
        Row: {
          id: string
          user_id: string
          cliente_id: string
          projeto_id: string | null
          valor: number
          vencimento: string
          status: 'Pago' | 'Aguardando' | 'Atrasado'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          cliente_id: string
          projeto_id?: string | null
          valor: number
          vencimento: string
          status?: 'Pago' | 'Aguardando' | 'Atrasado'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          cliente_id?: string
          projeto_id?: string | null
          valor?: number
          vencimento?: string
          status?: 'Pago' | 'Aguardando' | 'Atrasado'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      timesheet_entries: {
        Row: {
          id: string
          user_id: string
          projeto_id: string
          data: string
          descricao: string
          horas: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          projeto_id: string
          data: string
          descricao: string
          horas: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          projeto_id?: string
          data?: string
          descricao?: string
          horas?: number
          created_at?: string | null
        }
      }
      briefings: {
        Row: {
          id: string
          user_id: string
          cliente_id: string | null
          public_id: string
          nome: string
          descricao: string | null
          tipo: string | null
          tecnologias: string[] | null
          funcionalidades: Json | null
          incluso: string | null
          nao_incluso: string | null
          fases: Json | null
          prazo_total: string | null
          modelo: string
          valor: number
          condicoes_pagamento: string | null
          validade_proposta: string | null
          status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado'
          observacoes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          cliente_id?: string | null
          public_id?: string
          nome: string
          descricao?: string | null
          tipo?: string | null
          tecnologias?: string[] | null
          funcionalidades?: Json | null
          incluso?: string | null
          nao_incluso?: string | null
          fases?: Json | null
          prazo_total?: string | null
          modelo?: string
          valor?: number
          condicoes_pagamento?: string | null
          validade_proposta?: string | null
          status?: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado'
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          cliente_id?: string | null
          public_id?: string
          nome?: string
          descricao?: string | null
          tipo?: string | null
          tecnologias?: string[] | null
          funcionalidades?: Json | null
          incluso?: string | null
          nao_incluso?: string | null
          fases?: Json | null
          prazo_total?: string | null
          modelo?: string
          valor?: number
          condicoes_pagamento?: string | null
          validade_proposta?: string | null
          status?: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado'
          observacoes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      briefing_comentarios: {
        Row: {
          id: string
          briefing_id: string
          autor_tipo: 'freelancer' | 'cliente'
          autor_nome: string
          mensagem: string
          created_at: string | null
        }
        Insert: {
          id?: string
          briefing_id: string
          autor_tipo: 'freelancer' | 'cliente'
          autor_nome: string
          mensagem: string
          created_at?: string | null
        }
        Update: {
          id?: string
          briefing_id?: string
          autor_tipo?: 'freelancer' | 'cliente'
          autor_nome?: string
          mensagem?: string
          created_at?: string | null
        }
      }
      briefing_templates: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          tipo: string | null
          tecnologias: string[] | null
          funcionalidades: Json | null
          incluso: string | null
          nao_incluso: string | null
          fases: Json | null
          modelo: string
          valor: number
          condicoes_pagamento: string | null
          observacoes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao?: string | null
          tipo?: string | null
          tecnologias?: string[] | null
          funcionalidades?: Json | null
          incluso?: string | null
          nao_incluso?: string | null
          fases?: Json | null
          modelo?: string
          valor?: number
          condicoes_pagamento?: string | null
          observacoes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string | null
          tipo?: string | null
          tecnologias?: string[] | null
          funcionalidades?: Json | null
          incluso?: string | null
          nao_incluso?: string | null
          fases?: Json | null
          modelo?: string
          valor?: number
          condicoes_pagamento?: string | null
          observacoes?: string | null
          created_at?: string | null
        }
      }
      notificacoes: {
        Row: {
          id: string
          user_id: string
          titulo: string
          mensagem: string
          link: string | null
          lida: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          titulo: string
          mensagem: string
          link?: string | null
          lida?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          titulo?: string
          mensagem?: string
          link?: string | null
          lida?: boolean
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      projeto_modelo: 'Hora' | 'Fixo'
      projeto_status: 'Ativo' | 'Pausado' | 'Concluído' | 'Cancelado'
      tarefa_status: 'Backlog' | 'A Fazer' | 'Em Progresso' | 'Validação' | 'Concluído'
      fatura_status: 'Pago' | 'Aguardando' | 'Atrasado'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
