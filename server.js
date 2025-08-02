const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para webhook (recebe dados do frontend)
app.post('/webhook/appointment', async (req, res) => {
  try {
    const { client_name, haircut_type, cost, timestamp } = req.body;
    
    console.log('📋 Novo atendimento finalizado:', {
      client_name,
      haircut_type,
      cost,
      timestamp
    });

    // Aqui você pode adicionar integração com Google Sheets
    // await saveToGoogleSheets({ client_name, haircut_type, cost, timestamp });
    
    // Dados para enviar ao n8n
    const webhookData = {
      client_name,
      haircut_type,
      cost,
      timestamp,
      message: `✅ Atendimento finalizado!\n👤 Cliente: ${client_name}\n✂️ Corte: ${haircut_type}\n💰 Valor: R$ ${cost.toFixed(2)}\n🕒 Horário: ${new Date(timestamp).toLocaleString('pt-BR')}`
    };

    // Se você tiver a URL do webhook do n8n, descomente e configure:
    // const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    // if (N8N_WEBHOOK_URL) {
    //   const response = await fetch(N8N_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(webhookData)
    //   });
    //   console.log('📤 Dados enviados para n8n:', response.status);
    // }

    res.json({ 
      success: true, 
      message: 'Atendimento registrado com sucesso!',
      data: webhookData 
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Endpoint para adicionar cliente na fila
app.post('/api/add-client', (req, res) => {
  try {
    const { name, haircutType, cost } = req.body;
    
    if (!name || !haircutType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e tipo de corte são obrigatórios' 
      });
    }

    // Aqui você pode adicionar lógica para salvar no Google Sheets
    console.log('➕ Novo cliente adicionado:', { name, haircutType, cost });
    
    res.json({ 
      success: true, 
      message: 'Cliente adicionado à fila!',
      client: { name, haircutType, cost }
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});