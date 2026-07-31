-- ============================================
-- MIGRAÇÃO: Templates de Briefing e Notificações In-App
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de Templates de Briefing
CREATE TABLE briefing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  
  -- Campos copiados do briefing
  descricao TEXT,
  tipo TEXT,
  tecnologias TEXT[],
  funcionalidades JSONB DEFAULT '[]',
  incluso TEXT,
  nao_incluso TEXT,
  fases JSONB DEFAULT '[]',
  modelo TEXT DEFAULT 'Fixo',
  valor NUMERIC DEFAULT 0,
  condicoes_pagamento TEXT,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE briefing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus templates"
  ON briefing_templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================

-- 2. Tabela de Notificações
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários leem suas notificações"
  ON notificacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar status (lida) das notificações"
  ON notificacoes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Usuários podem excluir notificações"
  ON notificacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Permitir a trigger (banco de dados) inserir notificações
-- O bypass de RLS é feito com SECURITY DEFINER nas funções abaixo.

-- ============================================
-- 3. Triggers para Notificações Automáticas
-- ============================================

-- Trigger A: Novo Comentário do Cliente
CREATE OR REPLACE FUNCTION handle_new_briefing_comment()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_briefing_nome TEXT;
BEGIN
  -- Apenas se for do cliente
  IF NEW.autor_tipo = 'cliente' THEN
    -- Obter quem é o dono do briefing
    SELECT user_id, nome INTO v_user_id, v_briefing_nome
    FROM briefings WHERE id = NEW.briefing_id;
    
    -- Inserir notificação
    INSERT INTO notificacoes (user_id, titulo, mensagem, link)
    VALUES (
      v_user_id,
      'Novo comentário no briefing',
      NEW.autor_nome || ' comentou em "' || v_briefing_nome || '"',
      '/briefings/' || NEW.briefing_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_briefing_comment ON briefing_comentarios;
CREATE TRIGGER trg_new_briefing_comment
  AFTER INSERT ON briefing_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_briefing_comment();


-- Trigger B: Mudança de Status do Briefing pelo Cliente
CREATE OR REPLACE FUNCTION handle_briefing_status_change()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas se o status mudou para Aprovado ou Recusado
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Aprovado', 'Recusado') THEN
    
    -- Inserir notificação
    INSERT INTO notificacoes (user_id, titulo, mensagem, link)
    VALUES (
      NEW.user_id,
      'Proposta ' || NEW.status,
      'O cliente ' || LOWER(NEW.status) || ' a proposta "' || NEW.nome || '"',
      '/briefings/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_briefing_status_change ON briefings;
CREATE TRIGGER trg_briefing_status_change
  AFTER UPDATE OF status ON briefings
  FOR EACH ROW
  EXECUTE FUNCTION handle_briefing_status_change();
