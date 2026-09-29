// Validação e limpeza dos dados de produto (sem dependências externas).
const { HttpError } = require('../shared/errors');

const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const strList = (v, maxItems = 30, maxLen = 40) =>
  Array.isArray(v) && v.length <= maxItems && v.every((x) => typeof x === 'string' && x.length <= maxLen);
const money = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100000;

// campo -> [função de validação, mensagem de erro, obrigatório?]
const CAMPOS = {
  name:     [(v) => str(v, 80),  'name: informe o nome (até 80 caracteres).', true],
  category: [(v) => str(v, 40),  'category: informe a categoria.', true],
  price:    [money,              'price: informe um preço válido (número maior ou igual a 0).', true],
  oldPrice: [(v) => v === null || money(v), 'oldPrice: preço antigo inválido.'],
  desc:     [(v) => typeof v === 'string' && v.length <= 1000, 'desc: descrição com até 1000 caracteres.'],
  badge:    [(v) => typeof v === 'string' && v.length <= 20, 'badge: texto muito longo.'],
  icon:     [(v) => typeof v === 'string' && v.length <= 30, 'icon: inválido.'],
  color:    [(v) => typeof v === 'string' && v.length <= 30, 'color: inválido.'],
  colors:   [(v) => strList(v), 'colors: lista de textos (até 30 itens).'],
  sizes:    [(v) => strList(v), 'sizes: lista de textos (até 30 itens).'],
  models:   [(v) => strList(v), 'models: lista de textos (até 30 itens).'],
  lines:    [(v) => strList(v), 'lines: lista de textos (até 30 itens).'],
  featured: [(v) => typeof v === 'boolean', 'featured: use verdadeiro ou falso.'],
  available:[(v) => typeof v === 'boolean', 'available: use verdadeiro ou falso.'],
  photo:    [(v) => typeof v === 'string' && v.length <= 900000, 'photo: foto grande demais (limite do banco: 1 MB).'],
};
const RESERVADOS = new Set(['deleted']);          // controlados só pelo servidor
const isSimple = (v) => ['string', 'number', 'boolean'].includes(typeof v) && (typeof v !== 'string' || v.length <= 2000);

// Valida o corpo inteiro do produto. Campos não previstos passam se forem simples (não perde dados do app).
function validarProduto(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Envie os dados do produto em JSON.');
  const erros = [], out = {};
  for (const [campo, [ok, msg, obrigatorio]] of Object.entries(CAMPOS)) {
    const v = body[campo];
    if (v === undefined) { if (obrigatorio) erros.push(msg); continue; }
    if (!ok(v)) erros.push(msg); else out[campo] = typeof v === 'string' ? v.trim() : v;
  }
  for (const [k, v] of Object.entries(body)) {
    if (k in CAMPOS || k === 'id' || RESERVADOS.has(k)) continue;
    if (isSimple(v) || strList(v)) out[k] = v;
  }
  if (erros.length) throw new HttpError(400, 'Dados do produto inválidos.', erros);
  return out;
}

const ID_OK = /^[a-z0-9_-]{2,40}$/i;
function validarId(id) {
  if (!ID_OK.test(String(id || ''))) throw new HttpError(400, 'Identificador de produto inválido.');
  return id;
}
module.exports = { validarProduto, validarId };
