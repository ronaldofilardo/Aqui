# 📋 Resumo Executivo: Migração gestor-pf → BACKOFFICE

## 🎯 Objetivo

Renomear o perfil **`gestor-pf`** para **`BACKOFFICE`** em todo o sistema, refletindo corretamente sua função de **administrador técnico/operacional**.

---

## 🔍 Por que BACKOFFICE?

O nome atual `gestor-pf` é confuso porque:
- ❌ Sugere que é um "gestor" (quando na verdade é o **admin do sistema**)
- ❌ O sufixo "pf" (pessoa física) não tem relevância funcional
- ❌ Não diferencia claramente do perfil `GESTOR` (comercial)

**BACKOFFICE** é melhor porque:
- ✅ Reflete a função real: **gestão operacional do sistema**
- ✅ Diferencia de `GESTOR` (que é comercial/vendas)
- ✅ Termo padrão em sistemas SaaS para administração
- ✅ Indica nível hierárquico superior (backoffice > gestor > comercial)

---

## 📊 Hierarquia Atual vs Nova

### Atual (Confusa)
```
Usuario (tipo: "GESTOR", papel: "GESTOR_PF")  ← Admin do sistema
  └─ Lideranca
      ├─ Comercial (tipo: "COMERCIAL")
      └─ Gestor (tipo: "GESTOR")
```

### Nova (Clara)
```
Usuario (tipo: "BACKOFFICE")  ← Admin do sistema
  └─ Lideranca
      ├─ Comercial (tipo: "COMERCIAL")
      └─ Gestor (tipo: "GESTOR")
```

---

## 🗂️ O Que Será Alterado

### Banco de Dados
| Item | De | Para |
|------|----|----|
| Tabela | `gestores_pf` | `backoffices` |
| FKs | `gestor_pf_id` | `backoffice_id` |
| Enum | `GESTOR_PF` | `BACKOFFICE` |

### Backend
| Item | De | Para |
|------|----|----|
| Model Prisma | `GestorPF` | `Backoffice` |
| API Route | `/api/v1/gestor-pf/` | `/api/v1/backoffice/` |
| Auth Helper | `requireGestorPF()` | `requireBackoffice()` |
| Tipo Usuario | `"GESTOR_PF"` | `"BACKOFFICE"` |

### Frontend
| Item | De | Para |
|------|----|----|
| Diretório | `/gestor-pf/` | `/backoffice/` |
| Componentes | `gestor-pf/` | `backoffice/` |
| Sidebar | "Gestor PF" | "Backoffice" |
| Navegação | `/gestor-pf/dashboard` | `/backoffice/dashboard` |

---

## 📁 Arquivos Impactados

- **~100 arquivos** de código (.ts, .tsx)
- **~35 arquivos** SQL (migrações, seeds)
- **~72 ocorrências** de `GESTOR_PF`
- **~100 ocorrências** de `gestor-pf`

---

## 🔄 Cronograma

| Fase | Duração | Atividades |
|------|---------|------------|
| 1. Preparação | 1-2 dias | Backup, branch, scripts SQL |
| 2. Banco de Dados | 1 dia | Migração, testes |
| 3. Backend | 2-3 dias | Prisma, APIs, types |
| 4. Frontend | 2-3 dias | Componentes, páginas |
| 5. Testes | 2 dias | Unitários, E2E, manuais |
| 6. Deploy | 1-2 dias | Staging → Produção |

**Total:** 9-13 dias úteis

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Perda de dados | Crítico | Backup completo + teste em staging |
| Quebra de API | Alto | Manter aliases deprecated por 30 dias |
| Sessões inválidas | Médio | Force logout + invalidate sessions |
| Docs desatualizadas | Baixo | Revisar antes do deploy |

---

## ✅ Critérios de Aceite

- [ ] Todos os testes passando
- [ ] Migração reversível testada
- [ ] Deploy em staging validado
- [ ] Documentação atualizada
- [ ] Equipe notificada da mudança
- [ ] Rollback testado

---

## 🚀 Como Executar

### 1. Criar branch
```bash
git checkout -b feat/migrate-to-backoffice
```

### 2. Rodar migração (dev)
```bash
psql -U postgres -d asa_db -h localhost -f sql/migrate_gestor_pf_to_backoffice.sql
```

### 3. Gerar Prisma
```bash
cd packages/database && npx prisma generate
```

### 4. Testar
```bash
npm run test
npm run test:e2e
```

### 5. Deploy
```bash
# Staging
git push origin feat/migrate-to-backoffice

# Produção (após validação)
git checkout main
git merge feat/migrate-to-backoffice
git push origin main
```

---

## 📚 Documentação Completa

Veja o plano detalhado em: [`PLANO_MIGRACAO_BACKOFFICE.md`](./PLANO_MIGRACAO_BACKOFFICE.md)

---

**Status:** ✅ Plano aprovado e pronto para execução  
**Próximo Passo:** Agendar início da migração