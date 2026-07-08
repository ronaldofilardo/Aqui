# Archive - Documentação Histórica

Contém documentação de testes, correções pontuais e configurações legadas.

## Estrutura

```
archive/
├── README.md
├── *.md (documentos históricos)
├── scripts/
│   ├── genhash.js
│   └── update_hash.js
└── sql/
    └── VERIFICAR_DADOS.sql
```

## Conteúdo

### Validações e Testes (11 arquivos)
- `TESTES_*` - Logs de testes de funcionalidades
- `VALIDACAO_*` - Validações de autenticação e segurança

### Correções (3 arquivos)
- `CORRECOES_*` - Documentação de correções aplicadas
- `CORRECAO_*` - Correções específicas de produção

### Configurações e Setup (6 arquivos)
- `VERCEL_*` - Configurações antigas do Vercel
- `DEPLOY_*` - Checklists e guias de deploy
- `DB_CONSOLIDATION` - Histórico de consolidação de bancos

### Auditorias
- `SECURITY_REMEDIATION_AUDIT` - Auditoria de segurança (Maio 2026)

### Scripts (scripts/)
- `genhash.js` - Gerador de hash bcrypt
- `update_hash.js` - Script de atualização de senha

### SQL (sql/)
- `VERIFICAR_DADOS.sql` - Queries de verificação

### Arquitetura Legada
- `ARCHITECTURE_IMPROVEMENTS` - Melhorias arquiteturais antigas
- `GUIA_COMPLETO_COMISSOES` - Guia antigo de comissões

---

**Nota:** Esta documentação é mantida para referência histórica, mas pode estar desatualizada. Consulte a documentação ativa em `/docs` para informações correntes.