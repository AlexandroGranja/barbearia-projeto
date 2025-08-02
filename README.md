# 🚀 Sistema de Fila para Barbearia - Guia de Implantação no Railway

## 📋 Visão Geral

Sistema completo de gerenciamento de fila para barbearia com integração WhatsApp via n8n e Evolution API. Inclui interface responsiva, sistema de webhook e integração com Google Sheets.

## 🛠️ Pré-requisitos

Antes de começar, você precisa ter:

- Conta no [Railway](https://railway.app)
- Conta no [n8n](https://n8n.io) (pode ser self-hosted ou cloud)
- API do WhatsApp (Evolution API recomendada)
- Conta no Google Cloud (para Google Sheets API) - opcional

## 📱 Recursos do Sistema

### ✨ Funcionalidades Principais
- ✅ Sistema de fila em tempo real
- ✅ Controle de atendimento (Iniciar/Finalizar)
- ✅ Preço configurável para cada atendimento
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Integração com webhook para n8n
- ✅ Estatísticas em tempo real
- ✅ Persistência de dados local

### 🎨 Design
- Interface moderna e profissional
- Animações suaves
- Cores intuitivas (azul, verde, laranja)
- Totalmente responsivo

## 🚀 Passo a Passo para Implantação no Railway

### 1️⃣ Preparar o Projeto

1. **Baixe todos os arquivos** do sistema
2. **Crie uma pasta** no seu computador (ex: `barbearia-fila`)
3. **Coloque todos os arquivos** na pasta:
   - `package.json`
   - `server.js`
   - `index.html`
   - `app.js`
   - `.env.example`

### 2️⃣ Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Start a New Project"**
3. Faça login com GitHub, Google ou email
4. Confirme sua conta por email

### 3️⃣ Fazer Upload do Projeto

#### Opção A: Upload Direto
1. No Railway, clique em **"Deploy from GitHub repo"**
2. Selecione **"Deploy from folder"**
3. Faça upload da pasta com todos os arquivos
4. Railway detectará automaticamente que é um projeto Node.js

#### Opção B: Via GitHub (Recomendado)
1. **Crie um repositório** no GitHub
2. **Faça upload** dos arquivos para o repositório
3. No Railway, clique em **"Deploy from GitHub repo"**
4. **Conecte sua conta** do GitHub
5. **Selecione o repositório** criado

### 4️⃣ Configurar Variáveis de Ambiente

1. No painel do Railway, vá na aba **"Variables"**
2. Adicione as seguintes variáveis:

```env
PORT=3000
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/barbershop
GOOGLE_SHEETS_API_KEY=sua_api_key_aqui
GOOGLE_SHEETS_SPREADSHEET_ID=id_da_planilha
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_TOKEN=seu_token_aqui
```

### 5️⃣ Fazer Deploy

1. **Salve as variáveis** de ambiente
2. Railway fará o **deploy automaticamente**
3. Aguarde o processo de build (2-5 minutos)
4. Quando finalizar, clique em **"View Deployment"**

### 6️⃣ Obter URL do Projeto

1. No Railway, copie a **URL pública** do seu projeto
2. Ela será algo como: `https://barbearia-fila-production.up.railway.app`
3. **Teste o acesso** à URL

## 🔄 Configuração do n8n

### Criando o Workflow

1. **Acesse seu n8n**
2. **Crie um novo workflow**
3. **Adicione os seguintes nós:**

#### Nó 1: Webhook
- **Tipo:** HTTP Request Trigger
- **Método:** POST
- **URL:** `/webhook/barbershop`
- **Response:** Return Data

#### Nó 2: Set Data
- **Função:** Processar dados recebidos
- **Campos a mapear:**
  - `client_name`
  - `haircut_type`
  - `cost`
  - `timestamp`

#### Nó 3: Google Sheets (Opcional)
- **Operação:** Append Row
- **Planilha:** Sua planilha de controle
- **Dados:** Nome, Tipo de Corte, Valor, Horário

#### Nó 4: Evolution API (WhatsApp)
- **Método:** POST
- **URL:** `${EVOLUTION_API_URL}/message/sendText/${INSTANCE}`
- **Headers:**
  ```json
  {
    "apikey": "{{$env.EVOLUTION_API_TOKEN}}",
    "Content-Type": "application/json"
  }
  ```
- **Body:**
  ```json
  {
    "number": "5511999999999",
    "text": "✅ Atendimento finalizado!\n👤 Cliente: {{$json.client_name}}\n✂️ Corte: {{$json.haircut_type}}\n💰 Valor: R$ {{$json.cost}}\n🕒 Horário: {{$json.timestamp}}"
  }
  ```

### Ativar o Workflow
1. **Salve o workflow**
2. **Ative-o** (toggle no canto superior direito)
3. **Copie a URL do webhook** gerada pelo n8n
4. **Atualize a variável** `N8N_WEBHOOK_URL` no Railway

## 📊 Configuração do Google Sheets (Opcional)

### 1. Criar Planilha
1. **Acesse** [Google Sheets](https://sheets.google.com)
2. **Crie uma nova planilha** chamada "Controle Barbearia"
3. **Adicione os cabeçalhos** na primeira linha:
   - A1: Nome do Cliente
   - B1: Tipo de Corte
   - C1: Valor (R$)
   - D1: Data/Hora

### 2. Configurar API
1. **Acesse** [Google Cloud Console](https://console.cloud.google.com)
2. **Crie um novo projeto** ou selecione existente
3. **Ative a API** do Google Sheets
4. **Crie credenciais** (API Key)
5. **Copie a API Key** e **ID da planilha**
6. **Atualize as variáveis** no Railway

## 🔧 Configuração da Evolution API

### Opções de API WhatsApp

#### 1. Evolution API (Recomendada)
- **Site:** [Evolution API](https://evolution-api.com)
- **Documentação:** Completa e em português
- **Recursos:** Multi-instância, webhooks, QR Code

#### 2. WhatsApp Business API
- **Site:** [WhatsApp Business](https://business.whatsapp.com)
- **Custo:** Pago por mensagem
- **Recursos:** Oficial do WhatsApp

### Configuração Básica
1. **Instale** a Evolution API em seu servidor
2. **Crie uma instância** para a barbearia
3. **Configure o webhook** para receber mensagens
4. **Obtenha o token** de autenticação
5. **Teste** o envio de mensagens

## 📱 Como Usar o Sistema

### Para o Barbeiro:

1. **Adicionar Cliente:**
   - Preencha nome e tipo de corte
   - Digite o valor do serviço
   - Clique em "Adicionar à Fila"

2. **Iniciar Atendimento:**
   - Clique em "Iniciar" no primeiro cliente da fila
   - Cliente fica marcado como "em atendimento"

3. **Finalizar Atendimento:**
   - Clique em "Finalizar" quando terminar
   - Sistema envia webhook para n8n
   - Cliente é removido da fila
   - Estatísticas são atualizadas

### Para o Cliente (via WhatsApp):
- Recebe confirmação quando atendimento finaliza
- Pode receber notificação quando é sua vez (configurar no n8n)

## 🔍 Solução de Problemas

### ❗ Problemas Comuns

#### 1. Webhook não funciona
**Solução:**
- Verifique se a URL do n8n está correta
- Confirme que o workflow está ativo
- Teste manualmente no n8n

#### 2. WhatsApp não envia mensagens
**Solução:**
- Verifique credenciais da Evolution API
- Confirme se a instância está conectada
- Teste com Postman ou similar

#### 3. Google Sheets não salva
**Solução:**
- Verifique API Key
- Confirme permissões da planilha
- Teste acesso manual à API

#### 4. Site não carrega
**Solução:**
- Verifique logs no Railway
- Confirme se todas as dependências foram instaladas
- Teste localmente primeiro

### 📞 Logs e Depuração

#### No Railway:
1. Vá na aba **"Deployments"**
2. Clique no **último deploy**
3. Veja os **logs** em real-time
4. Procure por erros em vermelho

#### No n8n:
1. Vá na aba **"Executions"**
2. Veja o **histórico** de execuções
3. Clique em execuções **com erro**
4. Analise cada nó

## 🔒 Segurança

### Boas Práticas:
- ✅ Use HTTPS sempre (Railway fornece automaticamente)
- ✅ Mantenha tokens e API keys como variáveis de ambiente
- ✅ Não compartilhe credenciais publicamente
- ✅ Atualize dependências regularmente
- ✅ Monitore logs de acesso

### Backup:
- ✅ Faça backup da planilha Google Sheets
- ✅ Mantenha cópia do código no GitHub
- ✅ Documente configurações importantes

## 💡 Dicas Extras

### Performance:
- Sistema suporta até 50 clientes simultâneos
- Dados são salvos localmente no navegador
- Webhook é assíncrono (não trava interface)

### Personalização:
- Altere cores no arquivo `index.html`
- Adicione novos tipos de corte no select
- Modifique preços padrão
- Customize mensagens do WhatsApp

### Expansões Futuras:
- Sistema de agendamento
- Múltiplos barbeiros
- Relatórios avançados
- App mobile nativo

## 📞 Suporte

Em caso de dúvidas:

1. **Consulte os logs** do Railway e n8n
2. **Teste cada componente** separadamente
3. **Verifique configurações** de API
4. **Documente erros** para análise

---

**✅ Sistema criado e documentado em português**  
**🚀 Pronto para produção no Railway**  
**📱 Integração completa com WhatsApp**  
**📊 Controle total da fila de atendimento**

---

*Última atualização: Janeiro 2025*