import { describe, it, expect } from "vitest";
import { parseCupomFile } from "../src/lib/cupom-parser";

// CPF válido para testes: 529.982.247-25
const CPF_VALIDO = "52998224725";
const DATA_VALIDA = "15/04/2026";

describe("parseCupomFile", () => {
  it("deve parsear CSV válido com vírgula", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,São Paulo,Consulta,200,50%,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.erros).toHaveLength(0);
    expect(result.dados[0].nomeCupom).toBe("A200-001");
    expect(result.dados[0].preco).toBe(200);
    expect(result.dados[0].desconto).toBe(50);
    expect(result.dados[0].cpf).toBe(CPF_VALIDO);
    expect(result.dados[0].agendamento).toBeInstanceOf(Date);
  });

  it("deve parsear CSV com ponto-e-vírgula e formato BR", () => {
    const csv = `nome_cupom;paciente;campanha;local;servico;preco;desconto;agendamento;recurso;cpf
A200-002;Maria Santos;Acesso Saude Aqui;Rio de Janeiro;Consulta;1.500,00;30%;${DATA_VALIDA};sala2;${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].preco).toBe(1500);
    expect(result.dados[0].desconto).toBe(30);
  });

  it("deve parsear CSV com separador de tab", () => {
    const csv = `Nome do cupom\tPaciente\tCampanha\tLocal\tServiço\tPreço\tDesconto\tAgendamento\tRecurso\tCPF
A150\tteste final\tAcesso Saude Aqui\tBarbearia do SR. João\tCupom\t111,11\t10%\t15/04/2026\trecursos\t${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].nomeCupom).toBe("A150");
    expect(result.dados[0].preco).toBe(111.11);
    expect(result.dados[0].desconto).toBe(10);
  });

  it("deve permitir cupom repetido no arquivo (mesmo estabelecimento, pacientes diferentes)", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}
A200,Maria Santos,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}
A200,Ana Souza,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(3);
    expect(result.erros).toHaveLength(0);
  });

  it("deve rejeitar arquivo vazio", () => {
    const result = parseCupomFile("");
    expect(result.importados).toBe(0);
    expect(result.erros).toHaveLength(1);
    expect(result.erros[0].campo).toBe("arquivo");
  });

  it("deve rejeitar linha com colunas insuficientes", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João,SP`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("formato");
  });

  it("deve rejeitar desconto maior que 100%", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,150%,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("desconto");
  });

  it("deve rejeitar preço inválido", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,abc,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("preco");
  });

  it("deve rejeitar data de agendamento inválida", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,2026-04-15,sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("agendamento");
  });

  it("deve rejeitar data de agendamento inexistente (31/02)", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,31/02/2026,sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("agendamento");
  });

  it("deve rejeitar CPF inválido", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,12345678900`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("cpf");
  });

  it("deve aceitar CPF com formatação (pontos e traço)", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,529.982.247-25`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].cpf).toBe(CPF_VALIDO);
  });

  it("deve processar múltiplas linhas com erros e sucessos", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}
A200-002,,Acesso Saude Aqui,RJ,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}
A200-003,Ana Souza,Acesso Saude Aqui,MG,Consulta,300,25,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(2);
    expect(result.erros).toHaveLength(1);
    expect(result.totalLinhas).toBe(3);
  });

  it("deve usar campanha padrão quando vazio", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].campanha).toBe("Acesso Saude Aqui");
  });

  it("deve aceitar desconto sem símbolo %", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].desconto).toBe(50);
  });

  it("deve rejeitar paciente com nome muito curto", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,Jo,Acesso Saude Aqui,SP,Consulta,200,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("paciente");
  });

  it("deve rejeitar preço zero", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,0,50,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("preco");
  });

  it("deve rejeitar desconto negativo", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,-10,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(0);
    expect(result.erros[0].campo).toBe("desconto");
  });

  it("deve aceitar desconto zero (sem desconto)", () => {
    const csv = `nome_cupom,paciente,campanha,local,servico,preco,desconto,agendamento,recurso,cpf
A200-001,João Silva,Acesso Saude Aqui,SP,Consulta,200,0,${DATA_VALIDA},sala1,${CPF_VALIDO}`;
    const result = parseCupomFile(csv);
    expect(result.importados).toBe(1);
    expect(result.dados[0].desconto).toBe(0);
  });
});
