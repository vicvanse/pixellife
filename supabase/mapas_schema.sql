  -- ============================================
  -- MAPAS - Sistema de Experiências de Vida
  -- ============================================
  -- Pokédex da vida: registra experiências, não prescreve

  -- Tabela de categorias (fixas, definidas pelo sistema)
  CREATE TABLE IF NOT EXISTS mapas_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- 'esportes', 'cozinhar', 'criar', etc.
    name TEXT NOT NULL, -- 'Esportes', 'Cozinhar', etc.
    icon TEXT, -- emoji ou código de ícone
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Tabela de elementos (experiências dentro de cada categoria)
  CREATE TABLE IF NOT EXISTS mapas_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key TEXT NOT NULL REFERENCES mapas_categories(key) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Skate', 'Cozinhar tailandesa', etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_key, name)
  );

  -- Tabela de estados do usuário para cada elemento
  CREATE TABLE IF NOT EXISTS mapas_user_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    element_id UUID NOT NULL REFERENCES mapas_elements(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('not_done', 'experienced', 'satisfied', 'complete')),
    first_experienced_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, element_id)
  );

  -- Tabela de histórico (quando mudou de estado)
  CREATE TABLE IF NOT EXISTS mapas_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_element_id UUID NOT NULL REFERENCES mapas_user_elements(id) ON DELETE CASCADE,
    previous_state TEXT,
    new_state TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT, -- 'manual', 'habit', 'diary', 'biography', 'auto'
    metadata JSONB
  );

  -- Índices para performance
  CREATE INDEX IF NOT EXISTS idx_mapas_user_elements_user ON mapas_user_elements(user_id);
  CREATE INDEX IF NOT EXISTS idx_mapas_user_elements_state ON mapas_user_elements(state);
  CREATE INDEX IF NOT EXISTS idx_mapas_elements_category ON mapas_elements(category_key);
  CREATE INDEX IF NOT EXISTS idx_mapas_state_history_user_element ON mapas_state_history(user_element_id);

  -- RLS Policies
  ALTER TABLE mapas_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mapas_elements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mapas_user_elements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mapas_state_history ENABLE ROW LEVEL SECURITY;

  -- Remover policies existentes (se houver)
  DROP POLICY IF EXISTS "mapas_categories_read" ON mapas_categories;
  DROP POLICY IF EXISTS "mapas_elements_read" ON mapas_elements;
  DROP POLICY IF EXISTS "mapas_user_elements_own" ON mapas_user_elements;
  DROP POLICY IF EXISTS "mapas_state_history_own" ON mapas_state_history;

  -- Categorias são públicas (todos podem ler)
  CREATE POLICY "mapas_categories_read" ON mapas_categories
    FOR SELECT USING (true);

  -- Elementos são públicos (todos podem ler)
  CREATE POLICY "mapas_elements_read" ON mapas_elements
    FOR SELECT USING (true);

  -- Usuários só veem seus próprios estados
  CREATE POLICY "mapas_user_elements_own" ON mapas_user_elements
    FOR ALL USING (auth.uid() = user_id);

  -- Histórico só para o próprio usuário
  CREATE POLICY "mapas_state_history_own" ON mapas_state_history
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM mapas_user_elements
        WHERE mapas_user_elements.id = mapas_state_history.user_element_id
        AND mapas_user_elements.user_id = auth.uid()
      )
    );

  -- Inserir categorias iniciais
  INSERT INTO mapas_categories (key, name, icon, description) VALUES
    ('esportes', 'Esportes', '🏃', 'Mover o corpo de forma lúdica ou desafiadora'),
    ('cozinhar', 'Cozinhar', '🍳', 'Transformar comida por prazer ou curiosidade'),
    ('criar', 'Criar', '🎨', 'Produzir algo expressivo ou técnico'),
    ('consumir', 'Consumir', '🎬', 'Absorver experiências feitas por outros'),
    ('explorar', 'Explorar', '🌍', 'Sair do conhecido'),
    ('geral', 'Geral', '🌱', 'Experiências menos frequentes, mais difusas, mas significativas')
  ON CONFLICT (key) DO NOTHING;

  -- Inserir elementos completos por categoria
  INSERT INTO mapas_elements (category_key, name, description) VALUES
    -- 🏃 ESPORTES - Esportes individuais
    ('esportes', 'Caminhada longa (10km+)', 'Caminhada longa de 10km ou mais'),
    ('esportes', 'Corrida de rua', 'Correr na rua ou parques urbanos'),
    ('esportes', 'Corrida em trilha', 'Correr em trilhas naturais'),
    ('esportes', 'Natação', 'Nadar em piscina ou mar'),
    ('esportes', 'Ciclismo urbano', 'Pedalar na cidade'),
    ('esportes', 'Ciclismo de estrada', 'Pedalar em estradas'),
    ('esportes', 'Ciclismo em trilha (MTB)', 'Mountain bike em trilhas'),
    ('esportes', 'Musculação', 'Treino com pesos'),
    ('esportes', 'Calistenia', 'Exercícios com peso corporal'),
    ('esportes', 'Yoga', 'Praticar yoga'),
    ('esportes', 'Pilates', 'Praticar pilates'),
    ('esportes', 'Crossfit', 'Treino crossfit'),
    ('esportes', 'Artes marciais (genérico)', 'Praticar artes marciais'),
    ('esportes', 'Boxe', 'Praticar boxe'),
    ('esportes', 'Escalada indoor', 'Escalar em parede indoor'),
    ('esportes', 'Escalada outdoor', 'Escalar em rocha natural'),
    ('esportes', 'Skate', 'Andar de skate'),
    ('esportes', 'Longboard', 'Andar de longboard'),
    ('esportes', 'Patins', 'Andar de patins'),
    ('esportes', 'Slackline', 'Praticar slackline'),
    -- Esportes coletivos
    ('esportes', 'Futebol', 'Jogar futebol'),
    ('esportes', 'Futsal', 'Jogar futsal'),
    ('esportes', 'Basquete', 'Jogar basquete'),
    ('esportes', 'Vôlei', 'Jogar vôlei'),
    ('esportes', 'Vôlei de praia', 'Jogar vôlei de praia'),
    ('esportes', 'Handebol', 'Jogar handebol'),
    ('esportes', 'Rugby', 'Jogar rugby'),
    ('esportes', 'Ultimate frisbee', 'Jogar ultimate frisbee'),
    -- Esportes menos comuns
    ('esportes', 'Tiro esportivo', 'Praticar tiro esportivo'),
    ('esportes', 'Arco e flecha', 'Praticar arco e flecha'),
    ('esportes', 'Golfe', 'Jogar golfe'),
    ('esportes', 'Tênis', 'Jogar tênis'),
    ('esportes', 'Tênis de mesa', 'Jogar tênis de mesa'),
    ('esportes', 'Badminton', 'Jogar badminton'),
    ('esportes', 'Surf', 'Surfar'),
    ('esportes', 'Stand-up paddle', 'Praticar stand-up paddle'),
    ('esportes', 'Caiaque', 'Remar caiaque'),
    ('esportes', 'Remo', 'Praticar remo'),
    ('esportes', 'Equitação', 'Andar a cavalo'),
    ('esportes', 'Bull riding / montaria', 'Montaria em touro'),
    ('esportes', 'Parkour', 'Praticar parkour'),

    -- 🍳 COZINHAR - Práticas básicas
    ('cozinhar', 'Cozinhar uma refeição completa', 'Preparar refeição completa do zero'),
    ('cozinhar', 'Fazer café especial', 'Preparar café com método especial'),
    ('cozinhar', 'Fazer chá artesanal', 'Preparar chá de forma artesanal'),
    ('cozinhar', 'Preparar café da manhã elaborado', 'Fazer café da manhã especial'),
    ('cozinhar', 'Cozinhar para outras pessoas', 'Preparar comida para outros'),
    ('cozinhar', 'Cozinhar sozinho com calma', 'Cozinhar de forma relaxante'),
    ('cozinhar', 'Cozinhar sem receita', 'Criar receita improvisada'),
    -- Técnicas / experiências
    ('cozinhar', 'Assar pão', 'Fazer pão caseiro'),
    ('cozinhar', 'Fazer pizza do zero', 'Fazer pizza desde a massa'),
    ('cozinhar', 'Fazer massa fresca', 'Fazer massa caseira'),
    ('cozinhar', 'Fazer bolo', 'Fazer bolo caseiro'),
    ('cozinhar', 'Fazer sobremesa elaborada', 'Preparar sobremesa especial'),
    ('cozinhar', 'Fermentar alimentos', 'Fermentar alimentos'),
    ('cozinhar', 'Cozinhar vegetariano', 'Preparar comida vegetariana'),
    ('cozinhar', 'Cozinhar vegano', 'Preparar comida vegana'),
    ('cozinhar', 'Cozinhar comida apimentada', 'Preparar comida picante'),
    ('cozinhar', 'Cozinhar em fogo aberto', 'Cozinhar em fogueira'),
    ('cozinhar', 'Cozinhar em acampamento', 'Cozinhar durante acampamento'),
    -- Cozinhas do mundo
    ('cozinhar', 'Cozinha italiana', 'Cozinhar comida italiana'),
    ('cozinhar', 'Cozinha japonesa', 'Cozinhar comida japonesa'),
    ('cozinhar', 'Cozinha coreana', 'Cozinhar comida coreana'),
    ('cozinhar', 'Cozinha mexicana', 'Cozinhar comida mexicana'),
    ('cozinhar', 'Cozinha indiana', 'Cozinhar comida indiana'),
    ('cozinhar', 'Cozinha árabe', 'Cozinhar comida árabe'),
    ('cozinhar', 'Cozinha francesa', 'Cozinhar comida francesa'),
    ('cozinhar', 'Cozinha brasileira regional', 'Cozinhar comida brasileira regional'),

    -- 🎨 CRIAR - Criação artística
    ('criar', 'Desenhar', 'Desenhar'),
    ('criar', 'Pintar', 'Pintar'),
    ('criar', 'Ilustrar digitalmente', 'Criar ilustrações digitais'),
    ('criar', 'Fazer pixel art', 'Criar pixel art'),
    ('criar', 'Fotografia', 'Fotografar'),
    ('criar', 'Fotografia analógica', 'Fotografar com filme'),
    ('criar', 'Gravar vídeo', 'Gravar vídeos'),
    ('criar', 'Editar vídeo', 'Editar vídeos'),
    ('criar', 'Escrever ficção', 'Escrever ficção'),
    ('criar', 'Escrever poesia', 'Escrever poesia'),
    ('criar', 'Escrever diário', 'Escrever em diário'),
    ('criar', 'Compor música', 'Compor música'),
    ('criar', 'Produzir música digital', 'Produzir música digitalmente'),
    ('criar', 'Tocar instrumento', 'Tocar um instrumento'),
    ('criar', 'Cantar', 'Cantar'),
    -- Criação manual
    ('criar', 'Artesanato', 'Fazer artesanato'),
    ('criar', 'Cerâmica', 'Trabalhar com cerâmica'),
    ('criar', 'Marcenaria', 'Trabalhar com madeira'),
    ('criar', 'Costura', 'Costurar'),
    ('criar', 'Bordado', 'Bordar'),
    ('criar', 'Crochê', 'Fazer crochê'),
    ('criar', 'Tricô', 'Fazer tricô'),
    ('criar', 'Encadernação artesanal', 'Encadernar livros'),
    -- Criação intelectual / digital
    ('criar', 'Programar por prazer', 'Programar projetos pessoais'),
    ('criar', 'Criar um site pessoal', 'Criar site próprio'),
    ('criar', 'Criar um jogo', 'Desenvolver um jogo'),
    ('criar', 'Criar um app', 'Desenvolver um app'),
    ('criar', 'Criar um projeto pessoal', 'Desenvolver projeto pessoal'),
    ('criar', 'Criar um zine', 'Criar zine'),
    ('criar', 'Criar um blog', 'Criar blog'),

    -- 🎬 CONSUMIR - Audiovisual
    ('consumir', 'Assistir um filme no cinema', 'Ver filme no cinema'),
    ('consumir', 'Assistir filme em casa', 'Ver filme em casa'),
    ('consumir', 'Maratonar uma série', 'Assistir série completa'),
    ('consumir', 'Assistir documentário', 'Ver documentário'),
    ('consumir', 'Assistir animação', 'Ver animação'),
    ('consumir', 'Assistir anime', 'Ver anime'),
    ('consumir', 'Assistir curta-metragem', 'Ver curta-metragem'),
    ('consumir', 'Assistir show ao vivo', 'Ver show ao vivo'),
    ('consumir', 'Assistir espetáculo teatral', 'Ver peça de teatro'),
    ('consumir', 'Assistir stand-up comedy', 'Ver stand-up'),
    -- Leitura
    ('consumir', 'Ler um livro', 'Ler livro'),
    ('consumir', 'Ler um clássico', 'Ler livro clássico'),
    ('consumir', 'Ler poesia', 'Ler poesia'),
    ('consumir', 'Ler quadrinhos', 'Ler HQs'),
    ('consumir', 'Ler mangá', 'Ler mangá'),
    ('consumir', 'Ler não-ficção', 'Ler não-ficção'),
    ('consumir', 'Ler filosofia', 'Ler filosofia'),
    ('consumir', 'Ler psicologia', 'Ler psicologia'),
    ('consumir', 'Ler ficção científica', 'Ler ficção científica'),
    ('consumir', 'Ler fantasia', 'Ler fantasia'),
    -- Jogos
    ('consumir', 'Jogar videogame', 'Jogar videogame'),
    ('consumir', 'Jogar jogo indie', 'Jogar jogo indie'),
    ('consumir', 'Jogar jogo retrô', 'Jogar jogo retrô'),
    ('consumir', 'Jogar board game', 'Jogar jogo de tabuleiro'),
    ('consumir', 'Jogar card game', 'Jogar jogo de cartas'),
    ('consumir', 'Jogar RPG de mesa', 'Jogar RPG de mesa'),

    -- 🧭 EXPLORAR - Exploração urbana
    ('explorar', 'Caminhar sem destino', 'Caminhar sem rota definida'),
    ('explorar', 'Explorar o próprio bairro', 'Descobrir o próprio bairro'),
    ('explorar', 'Explorar outra região da cidade', 'Conhecer nova região'),
    ('explorar', 'Visitar museu', 'Ir a museu'),
    ('explorar', 'Visitar exposição', 'Ver exposição'),
    ('explorar', 'Ir a uma livraria', 'Visitar livraria'),
    ('explorar', 'Ir a um café novo', 'Conhecer café novo'),
    ('explorar', 'Ir a um bar diferente', 'Conhecer bar novo'),
    ('explorar', 'Ir a um restaurante novo', 'Conhecer restaurante novo'),
    -- Natureza
    ('explorar', 'Fazer trilha', 'Fazer trilha'),
    ('explorar', 'Acampar', 'Acampar'),
    ('explorar', 'Dormir ao ar livre', 'Dormir ao ar livre'),
    ('explorar', 'Ver o nascer do sol', 'Ver nascer do sol'),
    ('explorar', 'Ver o pôr do sol', 'Ver pôr do sol'),
    ('explorar', 'Observar estrelas', 'Observar estrelas'),
    ('explorar', 'Banho de cachoeira', 'Tomar banho de cachoeira'),
    ('explorar', 'Praia', 'Ir à praia'),
    ('explorar', 'Montanha', 'Visitar montanha'),
    ('explorar', 'Floresta', 'Visitar floresta'),
    -- Viagem
    ('explorar', 'Viagem curta', 'Fazer viagem curta'),
    ('explorar', 'Viagem sozinho', 'Viajar sozinho'),
    ('explorar', 'Viagem com amigos', 'Viajar com amigos'),
    ('explorar', 'Viagem em família', 'Viajar com família'),
    ('explorar', 'Viagem internacional', 'Viajar para outro país'),
    ('explorar', 'Mochilão', 'Fazer mochilão'),

    -- 🌱 GERAL - Corpo e cuidado
    ('geral', 'Skin care', 'Ritual de cuidados com a pele'),
    ('geral', 'Massagem', 'Receber massagem'),
    ('geral', 'Hidromassagem', 'Tomar hidromassagem'),
    ('geral', 'Sauna', 'Usar sauna'),
    ('geral', 'Banho relaxante', 'Tomar banho relaxante'),
    ('geral', 'Alongamento consciente', 'Fazer alongamento consciente'),
    ('geral', 'Dormir bem por uma semana', 'Manter sono de qualidade por uma semana')
  ON CONFLICT (category_key, name) DO NOTHING;

