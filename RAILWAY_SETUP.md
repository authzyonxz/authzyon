# AuthZyon — Guia de Deploy na Railway

## 🚀 Passo a Passo

### 1. Criar Conta na Railway
- Acesse: https://railway.app
- Faça login com GitHub
- Crie um novo projeto

### 2. Adicionar MySQL Database

1. Clique em "Add Service"
2. Selecione "MySQL"
3. Railway criará um banco automaticamente
4. Copie a `DATABASE_URL` (será usada depois)

### 3. Deploy do Código

1. Clique em "Add Service"
2. Selecione "GitHub"
3. Conecte seu repositório (ou faça upload do ZIP)
4. Railway detectará automaticamente que é Node.js

### 4. Configurar Variáveis de Ambiente

Na aba "Variables" do seu serviço, adicione:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=sua_chave_secreta_super_segura_aqui
VITE_APP_TITLE=AuthZyon
NODE_ENV=production
```

**Copie a DATABASE_URL do MySQL que criou no passo 2**

### 5. Configurar Build & Start

Railway detectará automaticamente:
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`

Se não detectar, configure manualmente:

1. Vá em "Settings"
2. Em "Build", configure:
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`

### 6. Criar Tabelas Automaticamente

O servidor criará as tabelas automaticamente na primeira execução:

1. Deploy será iniciado
2. Logs mostrarão: `[Seed] Admin user RUAN created successfully`
3. Tabelas serão criadas automaticamente
4. Pronto! ✅

### 7. Acessar seu App

Railway fornecerá uma URL pública:
```
https://seu-projeto-random.railway.app
```

---

## 📋 Variáveis de Ambiente Necessárias

| Variável | Valor | Obrigatório |
|----------|-------|------------|
| `DATABASE_URL` | `mysql://user:pass@host:port/db` | ✅ Sim |
| `JWT_SECRET` | Chave secreta aleatória | ✅ Sim |
| `NODE_ENV` | `production` | ✅ Sim |
| `VITE_APP_TITLE` | `AuthZyon` | ⚠️ Recomendado |
| `OWNER_NAME` | `Admin` | ⚠️ Recomendado |

---

## 🔧 Troubleshooting

### "Build failed"
- Verifique se o `package.json` está na raiz
- Confirme que `pnpm` está instalado
- Veja os logs completos na Railway

### "Cannot connect to database"
- Confirme que a `DATABASE_URL` está correta
- Verifique se o MySQL está rodando
- Teste a conexão localmente primeiro

### "Tables not created"
- Verifique os logs: `[Seed]` deve aparecer
- Se não aparecer, execute manualmente:
  ```bash
  pnpm drizzle-kit migrate
  ```

### "Admin user not created"
- Logs devem mostrar: `[Seed] Admin user RUAN created successfully`
- Se não aparecer, verifique o banco de dados

---

## 🔐 Segurança

1. **JWT_SECRET:** Use uma chave aleatória forte
   ```bash
   # Gerar chave segura:
   openssl rand -base64 32
   ```

2. **DATABASE_URL:** Nunca compartilhe publicamente

3. **Credenciais Admin:** Altere a senha padrão após o primeiro login

---

## 📊 Monitorar o Deploy

Na Railway:
1. Vá em "Deployments"
2. Veja o status em tempo real
3. Clique em "View Logs" para ver detalhes
4. Procure por `Server running on` para confirmar sucesso

---

## 🎯 Checklist Final

- [ ] MySQL criado na Railway
- [ ] Código enviado (GitHub ou ZIP)
- [ ] Variáveis de ambiente configuradas
- [ ] Build completou com sucesso
- [ ] Logs mostram `Server running on`
- [ ] Acessei a URL pública e funcionou
- [ ] Login com RUAN/RUAN123 funcionou
- [ ] Criei uma key de teste

---

## 📞 URLs Importantes

| Recurso | URL |
|---------|-----|
| **Painel Admin** | `https://seu-projeto.railway.app/login` |
| **Tela iOS** | `https://seu-projeto.railway.app/app` |
| **API Validação** | `https://seu-projeto.railway.app/api/public/validate-key` |
| **API Verificação** | `https://seu-projeto.railway.app/api/public/check-key/:key` |

---

**Pronto para deploy! 🚀**
