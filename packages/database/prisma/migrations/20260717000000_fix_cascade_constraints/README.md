# Migration: Fix dangerous ON DELETE CASCADE constraints

## Problem
The database schema used `ON DELETE CASCADE` on critical relationships, causing chain reactions that deleted entire hierarchies of data when a single record was removed.

## Chain of destruction (before fix)
```
Delete a Backoffice
  └─ CASCADE → Lideranças
       ├─ CASCADE → Gestores
       ├─ CASCADE → Comerciais → Metas + Comissões
       └─ CASCADE → Premios, CiclosPontos, Configs, Uploads

Delete a Parceiro
  └─ CASCADE → Indicados, Movimentações, Rankings, Solicitações

Delete a Usuário
  └─ CASCADE → Backoffice/Lideranca → TUDO ACIMA
```

## Solution
Changed `ON DELETE CASCADE` to `ON DELETE RESTRICT` (blocks deletion if children exist) or `ON DELETE SET NULL` (preserves children, unlinks them).

## Changes summary
| Table | Constraint | Before | After | Rationale |
|-------|-----------|--------|-------|-----------|
| consultores | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| estabelecimentos | consultor_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| documentos | estabelecimento_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| cupons_config | estabelecimento_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| cupons_importados | cupom_config_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| usuarios_estabelecimentos | estabelecimento_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| gestores_consultores | gestor_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| gestores_consultores | consultor_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| password_reset_tokens | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| password_reset_tokens | usuario_estabelecimento_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| backoffices | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| liderancas | backoffice_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| liderancas | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| gestores | lideranca_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| gestores | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| comerciais | lideranca_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| comerciais | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| parceiros | usuario_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| indicados | parceiro_id_fkey | CASCADE | RESTRICT | Prevent cascade deletion of indicated clients |
| uploads_planilha_backoffice | backoffice_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| primeira_acss | parceiro_id_fkey | CASCADE | SET NULL | Preserve tokens if partner removed |
| configuracoes_pontos | backoffice_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| ciclos_pontos | backoffice_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| movimentacoes_pontos | ciclo_pontos_id_fkey | CASCADE | RESTRICT | Prevent cycle cascade |
| movimentacoes_pontos | parceiro_id_fkey | CASCADE | RESTRICT | Preserve movements, block partner deletion |
| ranking_snapshots | ciclo_pontos_id_fkey | CASCADE | RESTRICT | Prevent cycle cascade |
| ranking_posicoes | ranking_snapshot_id_fkey | CASCADE | RESTRICT | Prevent snapshot cascade |
| ranking_posicoes | parceiro_id_fkey | CASCADE | RESTRICT | Preserve rankings, block partner deletion |
| premios | backoffice_id_fkey | CASCADE | RESTRICT | Prevent hierarchy cascade |
| solicitacoes_resgate | parceiro_id_fkey | CASCADE | RESTRICT | Prevent partner cascade |

## How deletion now works
To delete a Backoffice, you must first manually delete (or unlink) all:
1. Lideranças (and their Gestores/Comerciais)
2. Premios
3. CiclosPontos
4. ConfiguraçõesPontos
5. Uploads

The database will **block** any deletion that would orphan child records.
