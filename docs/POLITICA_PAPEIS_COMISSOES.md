# Política de Papéis e Comissões — ASA

## Perfis (`TipoUsuario`)

- ADMIN
- BACKOFFICE      → papel `BACKOFFICE`
- SUPERVISAO      → papel `NULL` (decisão D3)
- GERENCIA        → papel `NULL` (decisão D3)
- LIDERANCA       → papel `NULL`
- PARCEIRO        → papel `NULL`
- CONSULTOR       → papel `NULL`
- COMERCIAL       → papel `NULL`

## Quem recebe o quê

- **Por pontuação (`movimentacoes_pontos`)**: Parceiros.
  Pontuação é creditada em ciclos (`ciclos_pontos`), configurada por `configuracoes_pontos` por backoffice.
- **Por regra cadastrada**:
  - Comerciais → `regras_comerciais` (por backoffice)
  - Líderes, Supervisores, Gerentes → `regras_gestores` (por backoffice)
    - Colunas: `gerente_cire`, `supervisor_ativo`, `supervisor_receptivo`,
      `supervisor_franquia`, `supervisor_atendimento`,
      `gerente_atendimento`, `supervisor_comercial`.

## Regras de ação

- **BackOffice** (`back@asa.com`): cadastra/exclui Parceiros.
- **Parceiro**: cadastra Indicados (página `/parceiros/indicados`).
- **Líder**: inclui/exclui Comerciais.
- **Gerente, Supervisor, Líder, Comercial**: comissões por regra de backoffice.

## Glossário de Discrepâncias (status atualizado)

| # | Discrepância                          | Status            |
| - | ------------------------------------- | ----------------- |
| D1 | `TipoUsuario` sem `SUPERVISAO/GERENCIA` | RESOLVIDO         |
| D2 | `PapelGestor` continha `GESTOR_PF`     | RESOLVIDO         |
| D3 | Papel para SUPERVISAO/GERENCIA         | RESOLVIDO (NULL) |
| D5 | Parceiros precisam de pontos            | RESOLVIDO (`movimentacoes_pontos`) |
| D7 | Regras por perfil                       | RESOLVIDO (`regras_comerciais`/`regras_gestores`) |
| D8 | BackOffice semeado                     | RESOLVIDO         |
| D9 | Admin semeado                          | RESOLVIDO         |
| D10| Consultor semeado                      | RESOLVIDO         |
| D11| Não tocar em `gestores`/`liderancas`   | PRESERVADO        |
