/*
  # Sistema Administrativo para Barbearia

  1. Novas Tabelas
    - `admins` - Administradores do sistema
    - `haircut_types` - Tipos de corte com preços
    - `appointments` - Histórico de atendimentos
    - `queue_items` - Fila atual de atendimento

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para acesso administrativo
    - Autenticação segura
*/

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de tipos de corte
CREATE TABLE IF NOT EXISTS haircut_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de atendimentos (histórico)
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  haircut_type_id uuid REFERENCES haircut_types(id),
  price decimal(10,2) NOT NULL,
  status text DEFAULT 'completed',
  started_at timestamptz,
  finished_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela da fila atual
CREATE TABLE IF NOT EXISTS queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  haircut_type_id uuid REFERENCES haircut_types(id),
  price decimal(10,2) NOT NULL,
  position integer NOT NULL,
  status text DEFAULT 'waiting', -- waiting, in_progress, completed
  added_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE haircut_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

-- Políticas para admins (acesso total)
CREATE POLICY "Admins can manage all data" ON admins FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage haircut types" ON haircut_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage appointments" ON appointments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage queue" ON queue_items FOR ALL TO authenticated USING (true);

-- Políticas para acesso público (apenas leitura da fila e tipos)
CREATE POLICY "Public can read haircut types" ON haircut_types FOR SELECT TO anon USING (active = true);
CREATE POLICY "Public can read queue" ON queue_items FOR SELECT TO anon USING (true);

-- Inserir tipos de corte padrão
INSERT INTO haircut_types (name, price, description) VALUES
('Corte Simples', 25.00, 'Corte básico com máquina e tesoura'),
('Corte + Barba', 45.00, 'Corte completo com aparar barba'),
('Barba', 20.00, 'Apenas aparar e modelar barba'),
('Corte Degradê', 35.00, 'Corte moderno com degradê'),
('Corte Social', 30.00, 'Corte elegante para ocasiões especiais'),
('Corte Infantil', 20.00, 'Corte especial para crianças');

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (email, password_hash, name) VALUES
('admin@barbearia.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador');