import { auth } from "@/lib/auth";
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
  if ((session.user as any).tipo !== "ESTABELECIMENTO")
    return { session: null, error: forbidden() };
  return { session, error: null };
}
