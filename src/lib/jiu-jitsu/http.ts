/**
 * Utilitários HTTP compartilhados pelas rotas do módulo de lutas.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { ErroChave } from './chave';
import { primeiraMensagemErro } from './schemas';

/** Erro com status HTTP, lançado dentro das rotas/transações. */
export class ErroHttp extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ErroHttp';
  }
}

/** Lê e valida o corpo JSON. Lança ErroHttp(400) se inválido. */
export async function lerCorpo<S extends z.ZodTypeAny>(request: NextRequest, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ErroHttp(400, 'JSON inválido');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ErroHttp(400, primeiraMensagemErro(parsed.error));
  return parsed.data;
}

/** Converte erros conhecidos em resposta; os demais viram 500 com log. */
export function respostaDeErro(error: unknown, contexto: string): NextResponse {
  if (error instanceof ErroHttp) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ErroChave) {
    // Regra de negócio violada (ex.: luta ainda não está pronta).
    return NextResponse.json({ error: error.message }, { status: error.naoEncontrado ? 404 : 409 });
  }
  console.error(`${contexto}:`, error);
  return NextResponse.json({ error: contexto }, { status: 500 });
}
