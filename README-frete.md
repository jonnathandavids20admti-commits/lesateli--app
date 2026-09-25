# Reestruturação do frete — Lesateliê

## O que mudou no `index.html`

**Modelo de dados** (`siteContent/main`, campo `shipping`, no Firestore — nunca em
`localStorage`): método ativo (`distance` | `city` | `neighborhood`), endereço de
origem da loja com CEP e latitude/longitude, faixas de distância, distância
máxima, teto de frete opcional, frete grátis, tarifas por município, exceções
por bairro e exceções por CEP. Tudo editável em **Configurações → Entrega e
Frete**, sem nada fixo no front-end.

**Cálculo de distância**: CEP → endereço via ViaCEP (gratuito) → coordenadas via
Nominatim/OpenStreetMap (gratuito, sem chave) → distância em linha reta
(fórmula de Haversine) entre a loja e o cliente. As coordenadas ficam
guardadas (cache) no próprio endereço para não repetir a geocodificação toda
hora. A arquitetura já isola essa etapa (`geocodeAddress`/`ensureGeocode`) para
trocar por um serviço de rota real no futuro, como pedido no documento.

**Prioridade das regras** (implementada exatamente nesta ordem em
`calcShippingFee`): retirada → frete grátis → exceção de CEP → exceção de
bairro → regra de município → regra de distância → indisponível. Nunca
inventa distância ou valor: se não conseguir calcular, cai no fallback
existente ou avisa que a entrega não pôde ser calculada.

**Checkout**: o frete é recalculado do zero no momento de finalizar o pedido
(nunca reaproveita o valor mostrado no carrinho). Se vier indisponível, o
pedido é bloqueado com aviso. O pedido grava o "retrato" completo da entrega
(endereço usado, CEP, bairro, município, distância, método, regra aplicada,
valor do frete, frete grátis, retirada) — pedidos antigos não mudam se as
tarifas forem alteradas depois.

**Simuladores**: "Calcular frete" no carrinho (por CEP, sem precisar logar) e
"Testar cálculo de frete" dentro do painel admin.

## O que **não** dá para cumprir 100% sem acesso ao seu projeto Firebase

O site inteiro (inclusive antes desta mudança) fala direto com o Firestore
pelo navegador — não existe um servidor/Cloud Function rodando hoje. Por isso
a exigência de "o backend deve validar o frete antes da criação do pedido"
(seção 21) é implementada da melhor forma possível dentro dessa arquitetura:
o valor é recalculado do zero no momento da gravação (nunca confia em um
campo vindo da tela), e incluí um arquivo `firestore-frete-regras.txt` com
regras de segurança para reforçar isso no Firestore. Mas a validação
totalmente à prova de manipulação de verdade exige uma Cloud Function, que
eu não tenho como publicar sem acesso ao projeto — a lógica já está isolada
e comentada em `calcShippingFee` para ser portada para lá quando quiserem.

## Checklist de testes (seção 25 do prompt)

| # | Teste | Como conferir |
|---|-------|----------------|
| 1 | Cliente na 1ª faixa | Simulador admin com CEP próximo da loja |
| 2 | Cliente no limite entre faixas | Cadastre faixas 0–3 e 3–6; teste um CEP ~3km |
| 3 | Fora da distância máxima | CEP bem distante da loja → "indisponível" |
| 4 | Bairro com exceção | Cadastre uma exceção e teste o CEP daquele bairro |
| 5 | Pedido acima do mínimo | Carrinho com subtotal ≥ valor do frete grátis |
| 6 | Retirada | Selecionar "Retirada" → frete R$ 0,00, sem calcular distância |
| 7 | Alteração de tarifas | Mudar uma faixa → pedidos antigos mantêm o valor salvo |
| 8 | Falha no cálculo | CEP inválido/sem geocodificação → mensagem, nunca valor inventado |
| 9 | Manipulação pelo front-end | Ver `firestore-frete-regras.txt` + recálculo no `finalizeCheckout` |
| 10 | Celular | Tabelas do admin usam `overflow-x` só no componente, sem rolagem da página |

## Antes de publicar

- Confirme se `firestore.rules` do projeto já usa os nomes `siteContent/main` e
  `orders` — ajustei as regras para esses nomes por serem os que encontrei no
  `index.html`, mas vale conferir.
- O Nominatim (OpenStreetMap) é gratuito mas tem limite de uso justo para
  volume alto; se o volume de pedidos crescer muito, considere trocar por um
  serviço de geocodificação/rota pago (a arquitetura já está pronta pra isso).
- Teste o fluxo completo com um CEP real do Rio de Janeiro antes de divulgar.
