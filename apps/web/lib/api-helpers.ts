import { auth } from "@/lib/auth";
import { prisma } from "@asa/database";
import { NextResponse } from "next/server";

export async function getSession() {
  return await auth();
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string = "Não encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function created(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

export async function requireGestor() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "GESTOR")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "ADMIN")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireGestorWithScope() {
  const session = await getSession();
  if (!session?.user)
    return { session: null, consultorIds: [], error: unauthorized() };
  if (session.user.tipo !== "GESTOR")
    return { session: null, consultorIds: [], error: forbidden() };

  const gestoresConsultores = await prisma.gestorConsultor.findMany({
    where: { gestorId: session.user.id },
    select: { consultorId: true },
  });

  const consultorIds = gestoresConsultores.map((gc) => gc.consultorId);
  return { session, consultorIds, error: null };
}

export async function requireGestorWithUserScope() {
  const session = await getSession();
  if (!session?.user)
    return {
      session: null,
      consultorIds: [],
      usuarioIds: [],
      error: unauthorized(),
    };
  if (session.user.tipo !== "GESTOR")
    return {
      session: null,
      consultorIds: [],
      usuarioIds: [],
      error: forbidden(),
    };

  const gestoresConsultores = await prisma.gestorConsultor.findMany({
    where: { gestorId: session.user.id },
    select: {
      consultorId: true,
      consultor: { select: { usuarioId: true } },
    },
  });

  const consultorIds = gestoresConsultores.map(
    (gc: { consultorId: string; consultor: { usuarioId: string } }) =>
      gc.consultorId,
  );
  const usuarioIds = gestoresConsultores.map(
    (gc: { consultorId: string; consultor: { usuarioId: string } }) =>
      gc.consultor.usuarioId,
  );
  return { session, consultorIds, usuarioIds, error: null };
}

export async function requireConsultor() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "CONSULTOR")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  return { session, error: null };
}

export async function requireEstabelecimento() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "ESTABELECIMENTO")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireGestorPF() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "GESTOR_PF")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireParceiro() {
  const session = await getSession();
  if (!session?.user) return { session: null, error: unauthorized() };
  if (session.user.tipo !== "PARCEIRO")
    return { session: null, error: forbidden() };
  return { session, error: null };
}

export async function requireGestorPFWithScope() {
  const session = await getSession();
  if (!session?.user)
    return { session: null, gestorPfId: null, error: unauthorized() };
  if (session.user.tipo !== "GESTOR_PF")
    return { session: null, gestorPfId: null, error: forbidden() };

  const gestorPf = await prisma.gestorPF.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true },
  });

  if (!gestorPf)
    return { session: null, gestorPfId: null, error: forbidden() };

  return { session, gestorPfId: gestorPf.id, error: null };
}

export async function requireParceiroWithScope() {
  const session = await getSession();
  if (!session?.user)
    return { session: null, parceiroId: null, error: unauthorized() };
  if (session.user.tipo !== "PARCEIRO")
    return { session: null, parceiroId: null, error: forbidden() };

  const parceiro = await prisma.parceiro.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true, status: true },
  });

  if (!parceiro)
    return { session: null, parceiroId: null, error: forbidden() };

  return { session, parceiroId: parceiro.id, error: null };
}
