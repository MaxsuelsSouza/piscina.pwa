/**
 * Firestore em memória, só com o que as rotas do módulo de lutas usam.
 * Serve para testar as rotas sem credenciais nem emulador.
 */

type Dados = Record<string, unknown>;

/** O Firestore real recusa `undefined` e arrays dentro de arrays; o falso também. */
function validarGravacao(valor: unknown, caminho = 'doc', dentroDeArray = false): void {
  if (valor === undefined) throw new Error(`Firestore não aceita undefined em ${caminho}`);
  if (Array.isArray(valor)) {
    if (dentroDeArray) throw new Error(`Firestore não aceita array dentro de array em ${caminho}`);
    valor.forEach((v, i) => validarGravacao(v, `${caminho}[${i}]`, true));
  } else if (valor && typeof valor === 'object') {
    Object.entries(valor).forEach(([k, v]) => validarGravacao(v, `${caminho}.${k}`));
  }
}

export class FirestoreFalso {
  colecoes = new Map<string, Map<string, Dados>>();
  private seq = 0;

  private col(nome: string) {
    if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map());
    return this.colecoes.get(nome)!;
  }

  collection(nome: string) {
    const db = this;
    return {
      doc: (id?: string) => db.ref(nome, id ?? `id${++db.seq}`),
      add: async (dados: Dados) => {
        validarGravacao(dados);
        const id = `id${++db.seq}`;
        db.col(nome).set(id, structuredClone(dados));
        return db.ref(nome, id);
      },
      where: (campo: string, _op: '==', valor: unknown) => ({
        get: async () => ({
          docs: [...db.col(nome).entries()]
            .filter(([, d]) => d[campo] === valor)
            .map(([id, d]) => db.snap(id, d)),
        }),
      }),
    };
  }

  ref(colecao: string, id: string) {
    const db = this;
    return {
      id,
      colecao,
      get: async () => db.snap(id, db.col(colecao).get(id)),
      set: async (dados: Dados) => {
        validarGravacao(dados);
        db.col(colecao).set(id, structuredClone(dados));
      },
      delete: async () => void db.col(colecao).delete(id),
    };
  }

  snap(id: string, dados: Dados | undefined) {
    return { id, exists: dados !== undefined, data: () => (dados ? structuredClone(dados) : undefined) };
  }

  async getAll(...refs: ReturnType<FirestoreFalso['ref']>[]) {
    return Promise.all(refs.map((r) => r.get()));
  }

  async runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    const escritas: (() => void)[] = [];
    const tx = {
      get: (ref: ReturnType<FirestoreFalso['ref']>) => ref.get(),
      getAll: (...refs: ReturnType<FirestoreFalso['ref']>[]) => this.getAll(...refs),
      set: (ref: ReturnType<FirestoreFalso['ref']>, dados: Dados) => {
        validarGravacao(dados);
        escritas.push(() => this.col(ref.colecao).set(ref.id, structuredClone(dados)));
      },
      delete: (ref: ReturnType<FirestoreFalso['ref']>) => {
        escritas.push(() => this.col(ref.colecao).delete(ref.id));
      },
    };
    const resultado = await fn(tx);
    // Como no Firestore: só grava se a função terminar sem erro.
    escritas.forEach((e) => e());
    return resultado;
  }
}
