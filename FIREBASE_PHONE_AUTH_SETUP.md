# 📱 Configuração do Firebase Phone Authentication

Este guia explica como habilitar e configurar a autenticação por telefone no Firebase Console.

## ✅ Passo 1: Acessar o Firebase Console

1. Acesse https://console.firebase.google.com
2. Selecione seu projeto
3. No menu lateral, clique em **"Authentication"**

## ✅ Passo 2: Habilitar Phone Authentication

1. Clique na aba **"Sign-in method"**
2. Encontre **"Phone"** na lista de provedores
3. Clique em **"Phone"**
4. **Habilite** o provedor
5. Clique em **"Save"**

## ✅ Passo 3: Configurar domínios autorizados

1. Ainda em **Authentication** → **Settings**
2. Na seção **"Authorized domains"**, certifique-se de que seu domínio está listado:
   - `localhost` (para desenvolvimento)
   - Seu domínio de produção (ex: `seusite.com`)

## ✅ Passo 4: Configurar reCAPTCHA (IMPORTANTE!)

O Firebase usa reCAPTCHA para prevenir spam.

### ⚠️ Mensagem: "Failed to initialize reCAPTCHA Enterprise"

Se você ver essa mensagem, é normal! O Firebase tenta usar reCAPTCHA Enterprise primeiro, mas se não estiver configurado, ele automaticamente usa reCAPTCHA v2 (que já funciona).

**Isso NÃO é um erro!** O sistema vai funcionar normalmente com reCAPTCHA v2.

### Modo 1: reCAPTCHA Invisível (Recomendado)
✅ Já está configurado no código!
- O reCAPTCHA aparece automaticamente apenas quando necessário
- Melhor experiência do usuário

### Modo 2: reCAPTCHA Visível (se necessário)
Se quiser forçar a verificação visual:

```typescript
// Em src/lib/firebase/auth/phoneAuth.ts, mude de:
size: 'invisible',

// Para:
size: 'normal',
```

### Modo 3: reCAPTCHA Enterprise (Opcional)
Se quiser usar reCAPTCHA Enterprise (mais proteção):
1. No Google Cloud Console, habilite a API "reCAPTCHA Enterprise"
2. Crie uma chave reCAPTCHA Enterprise
3. Configure no Firebase Console

**Mas não é necessário!** O reCAPTCHA v2 funciona perfeitamente.

## ✅ Passo 5: Testar em Ambiente de Desenvolvimento

### Opção A: Usar Números de Teste (Recomendado para dev)

1. No Firebase Console → **Authentication** → **Sign-in method**
2. Role até **"Phone numbers for testing"**
3. Adicione um número de teste:
   - **Número**: `+5511999999999` (exemplo)
   - **Código**: `123456`
4. Clique em **"Add"**

Agora você pode testar sem enviar SMS reais!

### Opção B: Usar SMS Reais

Para enviar SMS reais em desenvolvimento:
1. O Firebase tem **10.000 verificações GRATUITAS por mês**
2. Certifique-se de que seu projeto está no **plano Blaze** (pay-as-you-go)
3. Configure um método de pagamento (mas só paga após exceder o limite gratuito)

## ✅ Passo 6: Configurar App Check (Opcional mas Recomendado)

O App Check protege contra uso abusivo:

1. No Firebase Console, vá em **App Check**
2. Clique em **"Register"** para seu app web
3. Selecione **reCAPTCHA Enterprise** ou **reCAPTCHA v3**
4. Siga as instruções

## 📱 Como Funciona o Fluxo

1. **Usuário digita nome e telefone** → Clica em "Entrar"
2. **Firebase envia SMS** com código de 6 dígitos
3. **Usuário digita o código** recebido no celular
4. **Firebase verifica** e autentica o usuário
5. **Sucesso!** Usuário tem acesso à lista de presentes

## 🔧 Formato do Número de Telefone

O sistema aceita telefones no formato:
- `(11) 99999-9999`
- `11999999999`
- `+5511999999999`

Todos são convertidos automaticamente para o formato internacional: `+5511999999999`

## 🌍 Limitações Geográficas

- **Brasil**: ✅ Totalmente suportado
- **Outros países**: Verifique a [lista de países suportados](https://firebase.google.com/docs/auth/web/phone-auth#supported-countries)

## 💰 Custos

### Plano Gratuito (Spark)
- **10.000 verificações/mês** GRÁTIS
- Perfeito para pequenos projetos

### Plano Blaze (Pay-as-you-go)
- Mesmas 10.000 verificações gratuitas
- Após isso: ~$0.01 por verificação

## 🐛 Troubleshooting

### Erro: "This domain is not authorized"
**Solução**: Adicione o domínio em **Authentication** → **Settings** → **Authorized domains**

### Erro: "reCAPTCHA has already been rendered in this element"
**Solução**: ✅ Já corrigido! O código agora limpa corretamente o reCAPTCHA entre tentativas.

Se ainda ocorrer, recarregue a página (F5).

### Erro: "reCAPTCHA client element has been removed"
**Solução**: O componente foi desmontado enquanto o reCAPTCHA estava ativo. O código já trata isso automaticamente.

### Erro: "Too many requests"
**Solução**:
1. Adicione números de teste (opção A acima)
2. Ou aguarde alguns minutos e tente novamente

### SMS não está chegando
**Verificar**:
1. ✅ Phone Authentication está habilitado no Firebase?
2. ✅ Projeto está no plano Blaze?
3. ✅ Número está no formato correto (+55...)?
4. ✅ Operadora do celular não está bloqueando SMS?

## 🎯 Próximos Passos

Após configurar:
1. Teste com um número de teste primeiro
2. Depois teste com seu próprio celular
3. Quando funcionar, faça deploy e teste em produção

## 📚 Documentação Oficial

- [Firebase Phone Auth - Web](https://firebase.google.com/docs/auth/web/phone-auth)
- [reCAPTCHA](https://firebase.google.com/docs/auth/web/phone-auth#use-invisible-recaptcha)
- [App Check](https://firebase.google.com/docs/app-check)

---

✅ **Pronto!** Agora sua aplicação está configurada para autenticação por telefone!
