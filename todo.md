# AuthZyon - TODO

## Backend
- [x] Schema do banco: tabelas authUsers, keys, loginHistory, keyActivations
- [x] Migração SQL aplicada ao banco
- [x] Autenticação customizada (RUAN/RUAN123) com JWT
- [x] Rota de login e logout customizado
- [x] Procedures: criar key, listar keys, editar key (pausar/banir/adicionar dias)
- [x] Procedures: criar usuário, listar usuários, banir usuário, ajustar limite
- [x] Procedures: dashboard stats
- [x] Procedures: histórico de login
- [x] Procedures: perfil (editar nome, foto)
- [x] API REST pública: POST /api/public/validate-key
- [x] API REST pública: GET /api/public/check-key/:key
- [x] Seed do admin RUAN/RUAN123

## Frontend - Painel Admin
- [x] Tema dark profissional (AuthZyon branding)
- [x] Tela de login customizada (usuário/senha)
- [x] DashboardLayout com sidebar
- [x] Página Dashboard com stats
- [x] Página Criar Keys (quantidade, duração, copiar todas)
- [x] Página Gerenciar Keys (listar, pausar, banir, adicionar dias)
- [x] Página Usuários (apenas admin)
- [x] Página Histórico de Login
- [x] Página Perfil (editar nome, foto)

## Frontend - Tela iOS
- [x] Rota /app com tela de validação de key (FFH4X branding)
- [x] Campo de inserção de key
- [x] Animação "Validando key..."
- [x] Mensagem de sucesso com data de expiração
- [x] Mensagem de erro personalizada
- [x] Persistência local (localStorage) da key validada
- [x] Auto-verificação ao reabrir o app
- [x] Tela "Carregando login..." com verificação automática

## Documentação
- [x] Documentação da API REST pública
- [x] Exemplos de integração Swift/iOS

## Bugs Corrigidos
- [x] Login travando no Safari — faltava cookie-parser no servidor
