const express = require('express');
const { getAdmin } = require('./shared/firebase');
const { HttpError } = require('./shared/errors');
const { createProdutosRepository } = require('./produtos/produtos.repository');
const { createProdutosService } = require('./produtos/produtos.service');
const { createProdutosRouter } = require('./produtos/produtos.routes');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const repo = createProdutosRepository(getAdmin().firestore());
  app.use('/produtos', createProdutosRouter(createProdutosService(repo)));
  app.get('/saude', (_req, res) => res.json({ ok: true }));

  app.use((_req, _res, next) => next(new HttpError(404, 'Rota não encontrada.')));
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ erro: status === 500 ? 'Erro interno. Tente novamente.' : err.message, detalhes: err.detalhes });
  });
  return app;
}
module.exports = { createApp };
