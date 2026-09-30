const COLECAO = 'products';

function createProdutosRepository(db) {
  const col = () => db.collection(COLECAO);
  return {
    async listar() {
      const snap = await col().get();
      return snap.docs.map((d) => d.data());
    },
    async buscar(id) {
      const doc = await col().doc(id).get();
      return doc.exists ? doc.data() : null;
    },
    async salvar(produto) {
      await col().doc(produto.id).set(produto);
      return produto;
    },
    async marcarExcluido(id) {
      await col().doc(id).set({ id, deleted: true }, { merge: true });
    },
  };
}
module.exports = { createProdutosRepository };
