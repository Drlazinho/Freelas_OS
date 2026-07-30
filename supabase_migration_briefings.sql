-- ============================================
-- MIGRAÇÃO: Briefings + Chat de Comentários
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Tabela principal de briefings
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  public_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  
  -- Dados do projeto
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  tecnologias TEXT[],
  
  -- Escopo
  funcionalidades JSONB DEFAULT '[]',
  incluso TEXT,
  nao_incluso TEXT,
  
  -- Planejamento
  fases JSONB DEFAULT '[]',
  prazo_total TEXT,
  
  -- Investimento
  modelo TEXT DEFAULT 'Fixo',
  valor NUMERIC DEFAULT 0,
  condicoes_pagamento TEXT,
  validade_proposta DATE,
  
  -- Status e controle
  status TEXT DEFAULT 'Rascunho',
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado gerencia seus briefings
CREATE POLICY "Usuários gerenciam seus briefings"
  ON briefings FOR ALL
  USING (auth.uid() = user_id);

-- Leitura pública (para a página do cliente)
CREATE POLICY "Leitura pública de briefings"
  ON briefings FOR SELECT
  USING (true);

-- Permitir UPDATE anônimo no status (aprovação/recusa pelo cliente)
CREATE POLICY "Cliente pode atualizar status"
  ON briefings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================

-- Tabela de comentários/chat do briefing
CREATE TABLE briefing_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  
  -- Quem enviou
  autor_tipo TEXT NOT NULL, -- 'freelancer' | 'cliente'
  autor_nome TEXT NOT NULL,
  
  -- Conteúdo
  mensagem TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE briefing_comentarios ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler comentários de um briefing
CREATE POLICY "Leitura pública de comentários"
  ON briefing_comentarios FOR SELECT
  USING (true);

-- Qualquer pessoa pode inserir comentários
CREATE POLICY "Inserção pública de comentários"
  ON briefing_comentarios FOR INSERT
  WITH CHECK (true);

-- Apenas o dono do briefing pode deletar comentários
CREATE POLICY "Freelancer deleta comentários"
  ON briefing_comentarios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM briefings 
      WHERE briefings.id = briefing_comentarios.briefing_id 
      AND briefings.user_id = auth.uid()
    )
  );
