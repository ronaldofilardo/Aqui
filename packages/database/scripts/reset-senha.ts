import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "gestor@asa.com";
  const novaSenha = process.argv[3] ?? "123456";

  const senhaHash = await hash(novaSenha, 12);

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (!existing) {
    console.error(`ERRO: usuário "${email}" não existe em usuarios.`);
    process.exit(1);
  }

  const updated = await prisma.usuario.update({
    where: { email },
    data: {
      senhaHash,
      senhaTemporaria: false,
      status: "ATIVO",
    },
  });

  console.log(`OK: senha de ${updated.email} (id=${updated.id}, tipo=${updated.tipo}) resetada para "${novaSenha}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
