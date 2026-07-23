/**
 * Testes - Validação das Correções da Tabela de Metas
 * Valida que os arquivos foram corrigidos corretamente
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Correções da Tabela de Metas - Validação', () => {
  const tabComerciaisPath = join(
    __dirname,
    '../(dashboard)/backoffice/comissionamento/components/tab-comerciais.tsx'
  );

  const pageComerciaisPath = join(
    __dirname,
    '../(dashboard)/backoffice/usuarios/comerciais/page.tsx'
  );

  it('tab-comerciais.tsx deve usar table-fixed em vez de sticky positioning', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');
    
    // Deve ter table-fixed
    expect(content).toContain('table-fixed');
    
    // Deve ter larguras fixas
    expect(content).toContain('w-[150px]'); // Comercial
    expect(content).toContain('w-[90px]');  // Função
    expect(content).toContain('w-[130px]'); // Ações
    
    // Não deve ter sticky positioning hardcoded
    expect(content).not.toContain('sticky left-0');
    expect(content).not.toContain('sticky left-64');
    expect(content).not.toContain('sticky left-[340px]');
    
    // Deve ter scroll apenas vertical
    expect(content).toContain('overflow-y-auto');
    expect(content).toContain('overflow-x-hidden');
    
    // Não deve ter overflow-x-auto
    expect(content).not.toContain('overflow-x-auto');
  });

  it('tab-comerciais.tsx deve ter header sticky no topo', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');
    
    // Deve ter sticky no header da tabela
    expect(content).toContain('sticky top-0');
  });

  it('page.tsx (usuarios/comerciais) deve usar table-fixed em vez de sticky positioning', () => {
    const content = readFileSync(pageComerciaisPath, 'utf-8');
    
    // Deve ter table-fixed
    expect(content).toContain('table-fixed');
    
    // Deve ter larguras fixas
    expect(content).toContain('w-[150px]'); // Comercial
    expect(content).toContain('w-[90px]');  // Função
    expect(content).toContain('w-[130px]'); // Ações
    
    // Não deve ter sticky positioning hardcoded nas células
    const lines = content.split('\n');
    const tbodySection = lines.findIndex(line => line.includes('<tbody>'));
    const tbodyEnd = lines.findIndex((line, idx) => idx > tbodySection && line.includes('</tbody>'));
    
    if (tbodySection !== -1 && tbodyEnd !== -1) {
      const tbodyContent = lines.slice(tbodySection, tbodyEnd).join('\n');
      expect(tbodyContent).not.toContain('sticky left-0');
      expect(tbodyContent).not.toContain('sticky left-[200px]');
      expect(tbodyContent).not.toContain('sticky left-[320px]');
    }
    
    // Deve ter scroll apenas vertical
    expect(content).toContain('overflow-y-auto');
    expect(content).toContain('overflow-x-hidden');
  });

  it('ambos os arquivos devem ter 12 colunas de meses visíveis', () => {
    const tabContent = readFileSync(tabComerciaisPath, 'utf-8');
    const pageContent = readFileSync(pageComerciaisPath, 'utf-8');
    
    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Verifica se todos os meses estão presentes no header
    mesesLabels.forEach((mes) => {
      expect(tabContent).toContain(`"${mes}"`);
      expect(pageContent).toContain(`"${mes}"`);
    });
  });

  it('tab-comerciais.tsx não deve usar duas tabelas separadas', () => {
    const content = readFileSync(tabComerciaisPath, 'utf-8');
    
    // Não deve ter a estrutura de duas tabelas lado a lado
    expect(content).not.toContain('flex-shrink-0 border-r');
    expect(content).not.toMatch(/<table[^>]*>.*<\/table>.*<table[^>]*>/s);
  });

  it('page.tsx não deve usar duas tabelas separadas', () => {
    const content = readFileSync(pageComerciaisPath, 'utf-8');
    
    // Não deve ter a estrutura de duas tabelas lado a lado
    expect(content).not.toContain('flex-shrink-0 border-r');
    expect(content).not.toMatch(/<table[^>]*>.*<\/table>.*<table[^>]*>/s);
  });
});