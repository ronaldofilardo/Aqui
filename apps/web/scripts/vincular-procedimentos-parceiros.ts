import { prisma } from "@asa/database";

/**
 * Script para vincular procedimentos órfãos aos parceiros baseado no CPF
 * Rodar: npx tsx apps/web/scripts/vincular-procedimentos-parceiros.ts
 */
async function main() {
  console.log("🔍 Buscando procedimentos sem parceiro...");

  const procedimentosOrfaos = await prisma.procedimentoPF.findMany({
    where: {
      parceiroId: null,
    },
    take: 1000,
  });

  console.log(`📊 Encontrados ${procedimentosOrfaos.length} procedimentos órfãos`);

  let vinculados = 0;
  let naoEncontrados = 0;
  let erros = 0;

  for (const proc of procedimentosOrfaos) {
    try {
      // Normalizar CPF do procedimento
      const cpfLimpo = proc.cpf.replace(/\D/g, "");

      // Buscar parceiro com este CPF
      const parceiro = await prisma.parceiro.findUnique({
        where: { cpf: cpfLimpo },
      });

      if (!parceiro) {
        console.log(`⚠️  Parceiro não encontrado para CPF: ${cpfLimpo} (Paciente: ${proc.paciente})`);
        naoEncontrados++;
        continue;
      }

      // Vincular procedimento ao parceiro
      await prisma.procedimentoPF.update({
        where: { id: proc.id },
        data: { parceiroId: parceiro.id },
      });

      console.log(`✅ Vinculado: ${proc.paciente} -> ${parceiro.nome}`);
      vinculados++;
    } catch (err) {
      console.error(`❌ Erro ao vincular procedimento ${proc.id}:`, err);
      erros++;
    }
  }

  console.log("\n📈 Resumo:");
  console.log(`✅ Vinculados: ${vinculados}`);
  console.log(`⚠️  Não encontrados: ${naoEncontrados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total processado: ${procedimentosOrfaos.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });