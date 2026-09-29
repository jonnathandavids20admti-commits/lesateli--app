// Rotas HTTP: traduz requisição -> service -> resposta. Nada de regra de negócio aqui.
const express = require('express');
const { requireAdmin } = require('../shared/auth');

function createProdutosRouter(service) {
  const r = express.Router();
  const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

  r.get('/',    h(async (_req, res) => res.json(await service.listar())));
  r.get('/:id', h(async (req, res) => res.json(await service.buscar(req.params.id))));
  r.post('/',       requireAdmin, h(async (req, res) => res.status(201).json(await service.criar(req.body))));
  r.put('/:id',     requireAdmin, h(async (req, res) => res.json(await service.atualizar(req.params.id, req.body))));
  r.delete('/:id',  requireAdmin, h(async (req, res) => { await service.excluir(req.params.id); res.status(204).end(); }));
  return r;
}
module.exports = { createProdutosRouter };
