import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções para gerenciar tipos de corte
export const haircutTypesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('haircut_types')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(haircutType) {
    const { data, error } = await supabase
      .from('haircut_types')
      .insert([haircutType])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('haircut_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('haircut_types')
      .update({ active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Funções para gerenciar fila
export const queueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('queue_items')
      .select(`
        *,
        haircut_types (name, price)
      `)
      .order('position');
    
    if (error) throw error;
    return data;
  },

  async add(item) {
    // Buscar próxima posição
    const { data: lastItem } = await supabase
      .from('queue_items')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (lastItem?.position || 0) + 1;

    const { data, error } = await supabase
      .from('queue_items')
      .insert([{ ...item, position }])
      .select(`
        *,
        haircut_types (name, price)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status, timestamps = {}) {
    const updates = { status, ...timestamps };
    
    const { data, error } = await supabase
      .from('queue_items')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        haircut_types (name, price)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async clear() {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) throw error;
  }
};

// Funções para histórico de atendimentos
export const appointmentsService = {
  async create(appointment) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointment])
      .select(`
        *,
        haircut_types (name, price)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getStats(startDate, endDate) {
    let query = supabase
      .from('appointments')
      .select('price, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    const totalRevenue = data.reduce((sum, apt) => sum + parseFloat(apt.price), 0);
    const totalAppointments = data.length;
    
    return {
      totalRevenue,
      totalAppointments,
      averagePrice: totalAppointments > 0 ? totalRevenue / totalAppointments : 0
    };
  }
};

// Funções para autenticação de admin
export const adminService = {
  async login(email, password) {
    // Buscar admin pelo email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha (em produção, use bcrypt)
    // Por simplicidade, vamos usar comparação direta
    const isValidPassword = password === 'admin123'; // Temporário
    
    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Salvar sessão no localStorage
    const session = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem('admin_session', JSON.stringify(session));
    return session;
  },

  logout() {
    localStorage.removeItem('admin_session');
  },

  getCurrentSession() {
    const session = localStorage.getItem('admin_session');
    return session ? JSON.parse(session) : null;
  },

  isAuthenticated() {
    return this.getCurrentSession() !== null;
  }
};