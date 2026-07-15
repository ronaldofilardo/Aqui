# 🧪 Script de Validação - Migração BACKOFFICE

## Comandos para Rodar Todos os Testes

### 1. Testes de Banco de Dados (Validação SQL)
```bash
psql -U postgres -d asa_db -h localhost -c "
SELECT 
  'backoffices' as tabela,
  COUNT(*) as total_registros
FROM backoffices
UNION ALL
SELECT 
  'liderancas' as tabela,
  COUNT(*) as total_registros
FROM liderancas
WHERE backoffice_id IS NOT NULL;
"
```

### 2. Testes Unitários (Vitest)
```bash
cd C:\apps\ASA
npm run test -- apps/web/app/__tests__/migracao-backoffice.test.ts
npm run test -- apps/web/app/__tests__/api-backoffice.test.ts
npm run test -- apps/web/app/__tests__/componentes-backoffice.test.ts
```

### 3. Testar Typecheck
```bash
npm run typecheck
```

### 4. Testar Build
```bash
npm run build
```

### 5. Testes Manuais (Checklist)

#### Login e Autenticação
- [ ] Acessar `/login`
- [ ] Logar com `backoffice@asa.com` / `123456`
- [ ] Verificar redirecionamento para `/backoffice/dashboard`
- [ ] Verificar se sidebar mostra "Backoffice"
- [ ] Verificar se todas as rotas estão acessíveis

#### Dashboard Backoffice
- [ ] Acessar `/backoffice/dashboard`
- [ ] Verificar se carrega sem erros
- [ ] Verificar se mostra estatísticas

#### Pontos
- [ ] Acessar `/backoffice/pontos`
- [ ] Verificar abas (Parceiros, Ciclos, Prêmios, Ranking)
- [ ] Testar criação de ciclo
- [ ] Testar distribuição de pontos

#### Usuários
- [ ] Acessar `/backoffice/usuarios/comerciais`
- [ ] Listar comerciais
- [ ] Criar novo comercial
- [ ] Editar comercial
- [ ] Configurar regras e comissões

#### Produção
- [ ] Acessar `/backoffice/producao/upload`
- [ ] Fazer upload de planilha
- [ ] Verificar processamento
- [ ] Acessar `/backoffice/producao/procedimentos`
- [ ] Listar procedimentos

#### Comissionamento
- [ ] Acessar `/backoffice/comissionamento/relatorios`
- [ ] Gerar relatório
- [ ] Acessar `/backoffice/comissionamento/pagamentos`
- [ ] Verificar pagamentos

#### Configurações
- [ ] Acessar `/backoffice/configuracoes`
- [ ] Acessar `/backoffice/configuracoes/regras`
- [ ] Acessar `/backoffice/configuracoes/comissoes`
- [ ] Editar configurações

### 6. Validação de API (curl)

```bash
# Testar endpoint de config (deve retornar 401 sem auth)
curl -i http://localhost:3000/api/v1/backoffice/config

# Testar endpoint de comerciais (deve retornar 401 sem auth)
curl -i http://localhost:3000/api/v1/backoffice/comerciais
```

### 7. Validação de Logs

```bash
# Verificar se há erros relacionados a gestor-pf
Get-Content apps\web\.next\build-manifest.json | Select-String "gestor-pf|GestorPF"

# Verificar se backoffice está presente
Get-Content apps\web\.next\build-manifest.json | Select-String "backoffice"
```

## Critérios de Aceite

### ✅ Banco de Dados
- [x] Tabela `backoffices` existe
- [x] Tabela `gestores_pf` NÃO existe
- [x] Todas as FKs `backoffice_id` existem
- [x] Enums `BACKOFFICE` existem
- [x] Índices renomeados

### ✅ Backend
- [x] Prisma client gerado sem erros
- [x] Types TypeScript compilam
- [x] APIs respondem (mesmo que 401 sem auth)
- [x] Auth helpers atualizados

### ✅ Frontend
- [x] Componentes renderizam
- [x] Sidebar mostra "Backoffice"
- [x] Rotas `/backoffice/*` acessíveis
- [x] Navegação funciona

### ✅ Testes
- [ ] Testes de banco passam
- [ ] Testes de API passam
- [ ] Testes de componentes passam
- [ ] Typecheck passa
- [ ] Build passa

## Relatório de Validação

Preencher após execução:

| Categoria | Status | Observações |
|-----------|--------|-------------|
| Banco de Dados | ⬜ | |
| Prisma Client | ⬜ | |
| Typecheck | ⬜ | |
| Build | ⬜ | |
| Testes Unitários | ⬜ | |
| Testes Manuais | ⬜ | |
| APIs | ⬜ | |
| Componentes | ⬜ | |

**Status Geral:** ⬜ Aprovado / ⬜ Reprovado

**Assinado:** ________________  
**Data:** __/__/____