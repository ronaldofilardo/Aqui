import { prisma } from "@asa/database";

async function main() {
  console.log("🔄 Atualizando data da configuração de pontos...");

  const updated = await prisma.configuracaoPontos.updateMany({
    data: {
      vigenteDesde: new Date("2026-06-01"),
    },
  });

  console.log(`✅ ${updated.count} configuração(ões) atualizada(s)`);

  // Verificar
  const configs = await prisma.configuracaoPontos.findMany({
    orderBy: { vigenteDesde: "desc" },
  });

  console.log("\n📋 Configurações:");
  configs.forEach((c) => {
    console.log(`  - Vigente desde: ${c.vigenteDesde.toLocaleDateString("pt-BR")}`);
    console.log(`    Valor: R$ ${c.valorPorPonto}`);
    console.log(`    Arredondamento: ${c.tipoArredondamento}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });