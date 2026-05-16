# Financeiro Acadêmico

Aplicativo web responsivo de controle financeiro pessoal para Emanuelle Torres Leal, mestranda em Engenharia Florestal.

## Como usar

Preencha `firebase-config.js` com as chaves do app Web criado no console do Firebase. Depois sirva esta pasta por HTTP e abra a URL no navegador.

Exemplos de servidores locais:

```bash
npx serve .
python -m http.server 8080
```

O app mantém `localStorage` como cache local e sincroniza em `users/{uid}/financeData/main` no Cloud Firestore após login com Google.

## Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Google.
3. Crie um banco Cloud Firestore.
4. Copie a configuração Web para `firebase-config.js`.
5. Publique as regras de segurança de `firebase.rules`.

Estrutura do documento principal:

```text
users/{uid}/financeData/main
```

O documento guarda `appState` para restauração fiel e também espelha campos como `settings`, `categories`, `paymentMethods`, `banks`, `cards`, `revenues`, `debts`, `installments`, `variableExpenses`, `goals`, `ru` e `updatedAt`.

## Hospedagem gratuita

Instale e publique com Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Este projeto já inclui `firebase.json` apontando a hospedagem para a pasta atual e `firebase.rules` para o Firestore.

## Recursos entregues

- Dashboard com indicadores financeiros, gráfico de categorias, receita vs despesas e projeção de saldo.
- Cadastro de receitas fixas, temporárias e extras.
- Controle de dívidas, parcelas, vencimentos, status e cronograma de quitação.
- Registro de gastos variáveis por categoria, forma de pagamento, cartão e quantidade de parcelas.
- Formas de pagamento: Nubank, Mercado Pago, Pix, débito Banco do Brasil, débito Banco Inter, dinheiro e cartão estudantil do RU.
- Controle de créditos do RU com recargas, consumo e saldo.
- Compras parceladas com parcela atual, parcelas restantes, valor total, cartão utilizado e data prevista de quitação.
- Metas financeiras com progresso visual.
- Relatório inteligente com recomendações automáticas de economia.
- Dashboard final com gráficos por categoria, forma de pagamento, cartão e despesas parceladas.
- CRUD com modais para receitas, dívidas, gastos, metas, categorias, subcategorias, bancos, cartões, contas, formas de pagamento e configurações.
- Categorias e subcategorias personalizáveis com cor e ícone/sigla.
- Bancos, contas e cartões com cor, logo personalizada ou ícone padrão.
- Recalculo automático de limites disponíveis dos cartões, saldo mensal, relatórios e cronograma após cada alteração.
- Exportação em CSV, Excel e PDF por impressão do navegador.
- Interface verde/branca, minimalista e responsiva para celular e computador.
- Login com Google via Firebase Authentication.
- Sincronização automática em nuvem com Cloud Firestore e cache local/offline.
- Indicadores de sincronização: carregando, salvando, sincronizado, modo offline e erro.
