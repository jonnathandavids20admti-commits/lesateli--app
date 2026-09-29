// Regras de negócio. Não conhece Express nem Firestore: recebe o repositório pronto (fácil de testar).
const { HttpError } = require('../shared/errors');
const { validarProduto, validarId } = require('./produtos.schema');

function novoId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

function createProdutosService(repo) {
  const ativo = (p) => p && !p.deleted;
  return {
    async listar() {
      return (await repo.listar()).filter(ativo);
    },
    async buscar(id) {
      const p = await repo.buscar(validarId(id));
      if (!ativo(p)) throw new HttpError(404, 'Produto não encontrado.');
      return p;
    },
    async criar(body) {
      const dados = validarProduto(body);
      const id = body && body.id ? validarId(body.id) : novoId();
      if (await repo.buscar(id)) throw new HttpError(409, 'Já existe um produto com este identificador.');
      return repo.salvar({ ...dados, id });
    },
    async atualizar(id, body) {                   // PUT = substitui o produto (o que não vier é removido)
      validarId(id);
      const existente = await repo.buscar(id);
      if (!ativo(existente)) throw new HttpError(404, 'Produto não encontrado.');
      return repo.salvar({ ...validarProduto(body), id });
    },
    async excluir(id) {
      validarId(id);
      const existente = await repo.buscar(id);
      if (!ativo(existente)) throw new HttpError(404, 'Produto não encontrado.');
      await repo.marcarExcluido(id);
    },
  };
}
module.exports = { createProdutosService };
