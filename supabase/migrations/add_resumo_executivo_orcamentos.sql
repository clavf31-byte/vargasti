-- Adiciona campo resumo_executivo na tabela orcamentos
ALTER TABLE public.orcamentos
ADD COLUMN resumo_executivo TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.orcamentos.resumo_executivo IS 'Resumo executivo que aparece na tela de aprovação do cliente. Se vazio, é gerado automaticamente a partir dos itens.';
