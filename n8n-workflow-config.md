# 🔄 Configuração Detalhada do Workflow n8n

## 📋 Visão Geral do Workflow

Este workflow do n8n processa os dados de atendimento finalizados na barbearia e envia notificações via WhatsApp usando a Evolution API.

## 🏗️ Estrutura do Workflow

### Fluxo Principal:
1. **Webhook** → 2. **Processar Dados** → 3. **Google Sheets** → 4. **WhatsApp** → 5. **Resposta**

## 🔧 Configuração Passo a Passo

### 1️⃣ Nó Webhook (HTTP Request Trigger)

```json
{
  "name": "Webhook Barbearia",
  "type": "n8n-nodes-base.httpRequest",
  "position": [240, 300],
  "parameters": {
    "httpMethod": "POST",
    "path": "barbershop",
    "responseMode": "responseNode",
    "options": {
      "allowedOrigins": "*"
    }
  }
}
```

**Configuração:**
- **Método:** POST
- **Caminho:** `barbershop`
- **Modo de Resposta:** Response Node
- **Origem Permitida:** * (ou seu domínio específico)

### 2️⃣ Nó Set Data (Processar Dados)

```json
{
  "name": "Processar Dados",
  "type": "n8n-nodes-base.set",
  "position": [460, 300],
  "parameters": {
    "values": {
      "string": [
        {
          "name": "cliente_nome",
          "value": "={{ $json.client_name }}"
        },
        {
          "name": "tipo_corte",
          "value": "={{ $json.haircut_type }}"
        },
        {
          "name": "valor",
          "value": "={{ $json.cost }}"
        },
        {
          "name": "data_hora",
          "value": "={{ $json.timestamp }}"
        },
        {
          "name": "mensagem_whatsapp",
          "value": "=✅ *Atendimento Finalizado - Barbearia Premium*\n\n👤 *Cliente:* {{ $json.client_name }}\n✂️ *Serviço:* {{ $json.haircut_type }}\n💰 *Valor:* R$ {{ $json.cost }}\n🕒 *Horário:* {{ new Date($json.timestamp).toLocaleString('pt-BR') }}\n\n✨ Obrigado pela preferência!\n📱 Entre em contato para agendar seu próximo horário."
        }
      ]
    }
  }
}
```

### 3️⃣ Nó Google Sheets (Opcional)

```json
{
  "name": "Salvar no Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "position": [680, 300],
  "parameters": {
    "operation": "appendRow",
    "documentId": "={{ $env.GOOGLE_SHEETS_SPREADSHEET_ID }}",
    "sheetName": "Atendimentos",
    "values": {
      "A": "={{ $json.cliente_nome }}",
      "B": "={{ $json.tipo_corte }}",
      "C": "={{ $json.valor }}",
      "D": "={{ $json.data_hora }}",
      "E": "=Finalizado"
    }
  },
  "credentials": {
    "googleApi": {
      "id": "1",
      "name": "Google Sheets API"
    }
  }
}
```

**Configuração:**
- **Operação:** Append Row
- **ID do Documento:** Variável de ambiente `GOOGLE_SHEETS_SPREADSHEET_ID`
- **Nome da Planilha:** "Atendimentos"
- **Valores:** Mapeamento das colunas A-E

### 4️⃣ Nó Evolution API (WhatsApp)

```json
{
  "name": "Enviar WhatsApp",
  "type": "n8n-nodes-base.httpRequest",
  "position": [900, 300],
  "parameters": {
    "method": "POST",
    "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
    "headers": {
      "apikey": "={{ $env.EVOLUTION_API_TOKEN }}",
      "Content-Type": "application/json"
    },
    "body": {
      "number": "5511999999999",
      "text": "={{ $json.mensagem_whatsapp }}"
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  }
}
```

**Configuração:**
- **Método:** POST
- **URL:** URL da Evolution API + endpoint
- **Headers:** API Key para autenticação
- **Body:** Número do WhatsApp e mensagem formatada

### 5️⃣ Nó Response (Resposta)

```json
{
  "name": "Resposta Success",
  "type": "n8n-nodes-base.respondToWebhook",
  "position": [1120, 300],
  "parameters": {
    "responseCode": 200,
    "responseBody": {
      "success": true,
      "message": "Atendimento processado com sucesso!",
      "data": {
        "cliente": "={{ $json.cliente_nome }}",
        "valor": "={{ $json.valor }}",
        "processado_em": "={{ new Date().toISOString() }}"
      }
    }
  }
}
```

## ⚙️ Variáveis de Ambiente Necessárias

No n8n, configure as seguintes variáveis:

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1abc123def456ghi789jkl
GOOGLE_SHEETS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx

# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_TOKEN=seu_token_aqui
EVOLUTION_INSTANCE=barbeariainstance

# Configurações gerais
BARBERSHOP_PHONE=5511999999999
```

## 🔀 Workflow Avançado com Múltiplas Funcionalidades

### Estrutura Expandida:

```
Webhook → Validar Dados → [
  ├── Salvar Google Sheets
  ├── Enviar WhatsApp Cliente
  ├── Notificar Próximo Cliente (se houver)
  ├── Atualizar Estatísticas
  └── Log de Auditoria
] → Resposta
```

### Nó de Validação de Dados:

```json
{
  "name": "Validar Dados",
  "type": "n8n-nodes-base.if",
  "position": [460, 300],
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.client_name }}",
          "operation": "isNotEmpty"
        },
        {
          "value1": "={{ $json.haircut_type }}",
          "operation": "isNotEmpty"
        },
        {
          "value1": "={{ $json.cost }}",
          "operation": "isNotEmpty"
        }
      ]
    }
  }
}
```

### Nó de Notificação para Próximo Cliente:

```json
{
  "name": "Notificar Próximo",
  "type": "n8n-nodes-base.httpRequest",
  "position": [900, 450],
  "parameters": {
    "method": "POST",
    "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
    "headers": {
      "apikey": "={{ $env.EVOLUTION_API_TOKEN }}",
      "Content-Type": "application/json"
    },
    "body": {
      "number": "5511888888888",
      "text": "🔔 *Sua vez está chegando!*\n\nOlá! O cliente anterior acabou de ser atendido.\nVocê é o próximo da fila na Barbearia Premium!\n\n⏰ Chegue em até 10 minutos\n📍 Endereço: [Seu endereço aqui]"
    }
  }
}
```

## 📊 Webhook de Teste

Para testar o webhook, use este payload:

```json
{
  "client_name": "João Silva",
  "haircut_type": "Corte + Barba",
  "cost": 120.00,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "duration": 25
}
```

## 🚨 Tratamento de Erros

### Nó de Erro para WhatsApp:

```json
{
  "name": "Erro WhatsApp",
  "type": "n8n-nodes-base.respondToWebhook",
  "position": [900, 500],
  "parameters": {
    "responseCode": 500,
    "responseBody": {
      "success": false,
      "error": "Falha ao enviar WhatsApp",
      "details": "={{ $json.error }}"
    }
  }
}
```

### Nó de Log de Erro:

```json
{
  "name": "Log Erro",
  "type": "n8n-nodes-base.httpRequest",
  "position": [700, 500],
  "parameters": {
    "method": "POST",
    "url": "https://seu-sistema-log.com/api/error",
    "body": {
      "timestamp": "={{ new Date().toISOString() }}",
      "workflow": "barbershop-webhook",
      "error": "={{ $json.error }}",
      "input_data": "={{ $input.all() }}"
    }
  }
}
```

## 🎯 Configurações Avançadas

### 1. Horário de Funcionamento

Adicione um nó IF para verificar horário:

```javascript
// Expressão JavaScript no nó IF
const now = new Date();
const hour = now.getHours();
const day = now.getDay(); // 0 = domingo, 6 = sábado

// Horário: Segunda a Sexta 8h-18h, Sábado 8h-14h
const isOpen = (day >= 1 && day <= 5 && hour >= 8 && hour < 18) || 
               (day === 6 && hour >= 8 && hour < 14);

return isOpen;
```

### 2. Diferentes Mensagens por Tipo de Corte

```javascript
// No nó Set Data
const messageTemplates = {
  "Corte Simples": "✂️ Corte simples finalizado!",
  "Corte + Barba": "✂️🧔 Corte completo com barba finalizado!",
  "Barba": "🧔 Barba aparada com perfeição!",
  "Corte Degradê": "✂️ Degradê moderno finalizado!",
  "Corte Social": "✂️ Corte social elegante finalizado!"
};

const haircutType = $json.haircut_type;
const customMessage = messageTemplates[haircutType] || "✂️ Atendimento finalizado!";

return customMessage;
```

### 3. Sistema de Fidelidade

```javascript
// Verificar quantidade de atendimentos do cliente
const clientName = $json.client_name;
// Buscar no Google Sheets quantas vezes o cliente já foi atendido
// Se >= 10, aplicar desconto ou corte grátis
```

## 📱 JSON Completo do Workflow

```json
{
  "name": "Barbershop Webhook Processor",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "barbershop",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook Barbearia",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "cliente_nome",
              "value": "={{ $json.client_name }}"
            },
            {
              "name": "tipo_corte", 
              "value": "={{ $json.haircut_type }}"
            },
            {
              "name": "valor",
              "value": "={{ $json.cost }}"
            },
            {
              "name": "data_hora",
              "value": "={{ $json.timestamp }}"
            },
            {
              "name": "mensagem_whatsapp",
              "value": "=✅ *Atendimento Finalizado - Barbearia Premium*\n\n👤 *Cliente:* {{ $json.client_name }}\n✂️ *Serviço:* {{ $json.haircut_type }}\n💰 *Valor:* R$ {{ $json.cost }}\n🕒 *Horário:* {{ new Date($json.timestamp).toLocaleString('pt-BR') }}\n\n✨ Obrigado pela preferência!"
            }
          ]
        }
      },
      "name": "Processar Dados",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "={{ $env.EVOLUTION_API_TOKEN }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "number",
              "value": "5511999999999"
            },
            {
              "name": "text",
              "value": "={{ $json.mensagem_whatsapp }}"
            }
          ]
        }
      },
      "name": "Enviar WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [680, 300]
    },
    {
      "parameters": {
        "responseBody": "={{ { \"success\": true, \"message\": \"Atendimento processado!\", \"cliente\": $json.cliente_nome } }}",
        "options": {}
      },
      "name": "Resposta Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook Barbearia": {
      "main": [
        [
          {
            "node": "Processar Dados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Processar Dados": {
      "main": [
        [
          {
            "node": "Enviar WhatsApp",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar WhatsApp": {
      "main": [
        [
          {
            "node": "Resposta Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {},
  "createdAt": "2025-01-27T10:00:00.000Z",
  "updatedAt": "2025-01-27T10:00:00.000Z",
  "id": "barbershop-webhook"
}
```

## ✅ Checklist de Ativação

- [ ] Webhook URL copiada e configurada no Railway
- [ ] Variáveis de ambiente configuradas no n8n
- [ ] Evolution API testada e funcionando
- [ ] Google Sheets criado com colunas corretas
- [ ] Workflow ativado no n8n
- [ ] Teste completo realizado
- [ ] Números de WhatsApp configurados corretamente

---

**🎯 Workflow completo e funcional**  
**📱 Integração WhatsApp via Evolution API**  
**📊 Dados salvos no Google Sheets**  
**⚡ Processamento em tempo real**