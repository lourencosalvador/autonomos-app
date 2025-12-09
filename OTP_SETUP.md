# 🔐 Sistema de OTP - Autonomos App

## 📋 O que foi implementado

Sistema completo de recuperação de senha com OTP (One-Time Password) via:
- ✅ **E-mail** usando Resend
- ✅ **SMS** usando Twilio Verify para Angola (+244)
- ✅ Código de **exatamente 5 dígitos**
- ✅ Expiração de **5 minutos**
- ✅ Templates bonitos e responsivos

---

## 🏗️ Arquitetura

```
Frontend (React Native)
  ↓
API Routes (Expo Router API)
  ↓
Services (OTP, Email, SMS)
  ↓
Providers (Resend, Twilio)
```

### Arquivos Criados:

```
src/
├── services/
│   ├── otpService.ts        # Geração, storage e verificação de OTP
│   ├── emailService.ts      # Envio de e-mail via Resend
│   ├── smsService.ts        # Envio de SMS via Twilio Verify
│   └── apiService.ts        # Chamadas API do frontend
├── app/
│   └── api/
│       ├── send-otp+api.ts  # POST /api/send-otp
│       └── verify-otp+api.ts # POST /api/verify-otp
└── components/
    └── SuccessModal.tsx     # Modal com animação Lottie
```

---

## ⚙️ Configuração

### 1. Copie o arquivo de exemplo

```bash
cp .env.example .env
```

### 2. Configure as variáveis de ambiente

Edite o arquivo `.env` e adicione suas chaves:

#### Resend (E-mail)
1. Crie conta em [resend.com](https://resend.com)
2. Crie uma API Key
3. Adicione ao `.env`:
   ```
   RESEND_API_KEY=re_sua_chave_aqui
   ```

#### Twilio (SMS)
1. Crie conta em [twilio.com](https://twilio.com)
2. Vá em **Verify** > **Services** > Crie um service
3. Pegue as credenciais e adicione ao `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxx
   TWILIO_VERIFY_SID=VAxxxxxxxxxx
   ```

### 3. Configure o domínio no Resend (se em produção)

Se for usar em produção, adicione e verifique seu domínio no Resend para evitar spam.

---

## 🚀 Como Usar

### Backend (API Routes)

As API routes do Expo Router funcionam **apenas na web** (`expo start --web`).

Para mobile, você precisa deployar o backend separadamente:

**Opção 1: Deploy na Vercel** (Recomendado)
```bash
# As API routes já estão prontas para deploy
vercel
```

**Opção 2: Servidor Node.js separado**
Você pode extrair as rotas API para um servidor Express standalone.

### Frontend

1. Configure a URL da API no `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://seu-backend.vercel.app
   ```

2. Execute o app:
   ```bash
   npm start
   ```

---

## 📡 Endpoints da API

### POST /api/send-otp

Envia código OTP por e-mail ou SMS.

**Request:**
```json
{
  "type": "email" | "sms",
  "value": "exemplo@gmail.com" | "912345678"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Código enviado com sucesso!"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "Código expirado ou inválido"
}
```

### POST /api/verify-otp

Verifica se o código OTP está correto.

**Request:**
```json
{
  "type": "email" | "sms",
  "value": "exemplo@gmail.com" | "912345678",
  "code": "48392"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Código verificado com sucesso!"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "Código expirado ou inválido"
}
```

---

## 📱 Formato de Números (Angola)

O sistema automaticamente formata números para Angola (+244):

- `912345678` → `+244912345678` ✅
- `244912345678` → `+244912345678` ✅
- `+244912345678` → `+244912345678` ✅

---

## 🎨 Template de E-mail

O e-mail enviado contém:
- ✅ Logo "Autonomos"
- ✅ Título claro
- ✅ Código em destaque (grande, colorido)
- ✅ Aviso de expiração (5 minutos)
- ✅ Footer com informações
- ✅ Design responsivo (mobile + desktop)

---

## 🔒 Segurança

- ✅ Códigos de 5 dígitos (10.000 a 99.999)
- ✅ Expiração automática (5 minutos)
- ✅ Limpeza automática de códigos expirados
- ✅ Validação no backend
- ✅ Rate limiting recomendado (não implementado ainda)

---

## 🐛 Troubleshooting

### "Erro ao enviar código"

1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que o Resend API Key está ativa
3. Para Twilio, verifique se o Verify Service está ativo

### "Código expirado ou inválido"

- O código expira após 5 minutos
- Certifique-se de inserir o código correto
- Use "Reenviar Código" se necessário

### SMS não chega

- Verifique se o número está no formato correto (+244...)
- Confirme que o Twilio Verify está configurado corretamente
- Verifique se há créditos na conta Twilio

---

## 📝 Próximos Passos

- [ ] Adicionar rate limiting (limite de tentativas)
- [ ] Implementar Redis para storage distribuído (em vez de memória)
- [ ] Adicionar logs/monitoring
- [ ] Implementar tela de "Redefinir Senha" após verificação
- [ ] Adicionar Analytics dos envios

---

## 🎯 Testando Localmente

Para testar, você pode usar o **Expo web**:

```bash
npm run web
```

As API routes funcionarão e você poderá testar o fluxo completo.

Para mobile, será necessário fazer o deploy do backend primeiro.

