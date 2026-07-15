import { prisma } from "../src/index";

async function limparBanco() {
  try {
    console.log("🧹 Iniciando limpeza do banco de dados...\n");

    // Limpar comissões
    await prisma.comissaoComercial.deleteMany();
    console.log("✅ Comissões limpas");

    // Limpar metas
    await prisma.metaComercial.deleteMany();
    console.log("✅ Metas limpas");

    // Limpar procedimentos PF
    await prisma.procedimentoPF.deleteMany();
    console.log("✅ Procedimentos PF limpos");

    // Limpar uploads PF
    await prisma.uploadPlanilhaPF.deleteMany();
    console.log("✅ Uploads PF limpos");

    // Limpar procedimentos
    await prisma.procedimento.deleteMany();
    console.log("✅ Procedimentos limpos");

    // Limpar comerciais
    await prisma.comercial.deleteMany();
    console.log("✅ Comerciais limpos");

    // Limpar gestores PF
    await prisma.backoffice.deleteMany();
    console.log("✅ Gestores PF limpos");

    // Limpar regras comerciais
    await prisma.regraComercial.deleteMany();
    console.log("✅ Regras Comerciais limpas");

    // Limpar regras de gestores
    await prisma.regraGestor.deleteMany();
    console.log("✅ Regras Gestor limpas");

    await prisma.$disconnect();
    console.log("\n✅ Limpeza concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao limpar banco:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

limparBanco();