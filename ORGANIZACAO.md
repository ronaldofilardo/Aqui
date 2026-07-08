# Guia de Organização do Projeto

## 📁 Estrutura de Pastas

```
asa-monorepo/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages & API routes
│       ├── components/         # React components
│       ├── lib/                # Utilities & helpers
│       ├── hooks/              # Custom React hooks
│       └── scripts/            # Scripts específicos do web
│
├── packages/
│   ├── database/               # Prisma ORM & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       └── index.ts
│   │
│   └── shared/                 # Shared types & schemas
│       ├── src/
│       │   ├── types.ts
│       │   ├── schemas.ts
│       │   └── constants.ts
│       └── tests/
│
├── docs/                       # Documentação ativa (referência)
│   ├── README.md
│   └── PONTOS_SISTEMA.md
│
├── archive/                    # Documentação histórica
│   ├── README.md
│   ├── TESTES_*.md
│   ├── CORRECOES_*.md
│   └── ...
│
├── scripts/                    # Scripts do monorepo
│   ├── *.ps1 (PowerShell)
│   └── *.ts (TypeScript)
│
└── .agents/                    # Agent skills (Claude)
└── .claude/                    # Claude configuration
```

---

## 📝 Políticas de Organização

### Raiz do Projeto

**Mantenha apenas:**
- ✅ Arquivos de configuração (package.json, turbo.json, tsconfig.*)
- ✅ Arquivos de ambiente (.env.*, .gitignore)
- ✅ Documentação essencial (README.md, POLITICA_REFATORACAO.md)
- ✅ Diretórios de código (apps/, packages/, docs/, scripts/)

**Movar para archive/:**
- 📦 Scripts utilitários pontuais (genhash.js, update_hash.js)
- 📦 Logs de testes e validações concluídas
- 📦 Documentação de correções específicas
- 📦 Auditorias e verificações pontuais

### Pasta /docs

**Documentação Ativa (permanece):**
- ✅ README.md - Índice e navegação
- ✅ PONTOS_SISTEMA.md - Sistema de pontos (referência)
- ✅ Documentos de arquitetura e padrões

**Movar para archive/ após uso:**
- 📦 TESTES_* - Logs de testes após validação
- 📦 CORRECOES_* - Correções após resolução
- 📦 VERCEL_* - Configurações específicas de deploy
- 📦 SQL scripts - Queries de verificação pontual
- 📦 GUIAS_* - Guias temporários de implementação

### Pasta /archive

**Estrutura sugerida:**
```
archive/
├── README.md
├── 2026-05/
│   ├── SECURITY_REMEDIATION_AUDIT.md
│   └── VALIDACAO_AUTH_COMPLETA.md
├── 2026-06/
│   ├── TESTES_COMISSOES.md
│   └── CORRECAO_SIDBAR.md
└── scripts/
    ├── genhash.js
    └── update_hash.js
```

---

## 🔄 Fluxo de Organização

### Quando criar novo arquivo em /docs

1. **É documentação de referência?** → `/docs`
2. **É teste/validação pontual?** → `/archive`
3. **É correção específica?** → `/archive`
4. **É guia temporário?** → `/archive` após implementação

### Quando mover para /archive

**Critérios:**
- ✅ Teste foi completado e aprovado
- ✅ Correção foi aplicada e validada
- ✅ Implementação temporária foi concluída
- ✅ Documento foi substituído por versão atualizada

**Como mover:**
```powershell
# Mover teste concluído
Move-Item docs\TESTES_XYZ.md archive\

# Mover correção aplicada
Move-Item docs\CORRECAO_ABC.md archive\

# Mover script utilitário
Move-Item script-util.js archive\
```

---

## 📊 Estado Atual

### Raiz
- **Arquivos:** 17
- **Diretórios:** apps/, packages/, docs/, archive/, scripts/

### /docs (Ativa)
- **Arquivos:** 2
  - README.md
  - PONTOS_SISTEMA.md

### /archive (Histórico)
- **Arquivos:** 23
  - 13 arquivos de testes
  - 4 arquivos de correções
  - 4 arquivos de configuração
  - 2 scripts utilitários

---

## 🎯 Próximos Passos

1. **Revisar scripts/** - Mover scripts pontuais para archive/
2. **Consolidar docs antigas** - Unificar documentação duplicada
3. **Criar índice remissivo** - Linkar documentos relacionados
4. **Automatizar organização** - Script para identificar arquivos >6 meses

---

*Última atualização: Julho 2026*