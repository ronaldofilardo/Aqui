import { prisma } from "@asa/database";

async function main() {
  console.log("🏆 Verificando Ranking...\n");

  const backoffice = await prisma.backoffice.findFirst();
  if (!backoffice) {
    console.log("❌ Backoffice não encontrado");
    return;
  }

  // Buscar ciclo vigente
  const ciclo = await prisma.cicloPontos.findFirst({
    where: {
      backofficeId: backoffice.id,
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
  });

  if (!ciclo) {
    console.log("❌ Ciclo vigente não encontrado");
    return;
  }

  console.log(`Ciclo: ${ciclo.nome}`);

  // Buscar todos os parceiros
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId: backoffice.id },
    include: {
      comerciais: { include: { parceiros: { select: { id: true, nome: true, cpf: true } } } },
      gestores: { include: { parceiros: { select: { id: true, nome: true, cpf: true } } } }
    }
  });

  const parceiros = [
    ...liderancas.flatMap(l => l.comerciais.flatMap(c => c.parceiros)),
    ...liderancas.flatMap(l => l.gestores.flatMap(g => g.parceiros))
  ];

  console.log(`\n📊 Ranking de Parceiros:\n`);

  // Calcular pontos para cada parceiro
  const ranking = await Promise.all(
    parceiros.map(async (p) => {
      const creditos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId: p.id,
          cicloPontosId: ciclo.id,
          tipo: "CREDITO",
        },
      });

      const debitos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId: p.id,
          cicloPontosId: ciclo.id,
          tipo: "DEBITO",
        },
      });

      const estornos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId: p.id,
          cicloPontosId: ciclo.id,
          tipo: "ESTORNO",
        },
      });

      const c = creditos._sum.quantidade || 0;
      const d = debitos._sum.quantidade || 0;
      const e = estornos._sum.quantidade || 0;
      const pontos = c - d + e;

      return {
        parceiro: p,
        pontos,
      };
    }),
  );

  // Ordenar e mostrar
  ranking
    .sort((a, b) => b.pontos - a.pontos)
    .forEach((item, index) => {
      const medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
      console.log(`${medalha} ${index + 1}º - ${item.parceiro.nome}: ${item.pontos} pontos`);
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