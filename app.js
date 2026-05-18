const storageKey = "financeiro-academico-state";
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const today = new Date();
let scheduleCloudSave = () => {};
let deferredInstallPrompt = null;
let driveStatus = { status: "Modo local", connected: false, lastSyncAt: "" };
let suppressSyncSave = false;

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  if (window.structuredClone) return window.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

const palette = ["#147a4b", "#78b159", "#2d9cdb", "#f2c94c", "#eb5757", "#9b51e0", "#00a896", "#f2994a", "#6fcf97", "#4f4f4f", "#8f6b4f", "#516070", "#7a4a8a"];

const defaultCategories = [
  ["Alimentação", "#147a4b", "A"],
  ["Restaurante Universitário (RU)", "#78b159", "RU"],
  ["Transporte", "#2d9cdb", "T"],
  ["Saúde", "#eb5757", "S"],
  ["Lazer", "#f2994a", "L"],
  ["Material Acadêmico", "#9b51e0", "M"],
  ["Congressos", "#00a896", "C"],
  ["Farmácia", "#6fcf97", "F"],
  ["Roupas", "#8f6b4f", "R"],
  ["Emergência", "#c0392b", "E"],
  ["Moradia", "#516070", "MO"],
  ["Assinaturas", "#7a4a8a", "AS"],
  ["Outros", "#4f4f4f", "O"],
].map(([name, color, icon]) => ({ id: uid(), name, color, icon }));

function byName(list, name) {
  return list.find((item) => item.name === name)?.id || "";
}

const defaultBanks = [
  { id: uid(), name: "Banco do Brasil", type: "corrente", logo: "", logoText: "BB", balance: 0, color: "#f2c94c", status: "ativo" },
  { id: uid(), name: "Banco Inter", type: "corrente", logo: "", logoText: "BI", balance: 0, color: "#f2994a", status: "ativo" },
  { id: uid(), name: "Nubank", type: "cartão", logo: "", logoText: "NU", balance: 0, color: "#8a05be", status: "ativo" },
  { id: uid(), name: "Mercado Pago", type: "carteira digital", logo: "", logoText: "MP", balance: 0, color: "#00a7e1", status: "ativo" },
  { id: uid(), name: "Cartão Estudantil (RU)", type: "cartão", logo: "", logoText: "RU", balance: 30, color: "#147a4b", status: "ativo" },
];

const defaultCards = [
  { id: uid(), name: "Nubank", bankId: byName(defaultBanks, "Nubank"), limit: 700, closingDay: 2, dueDay: 10, color: "#8a05be", logo: "", logoText: "NU", status: "ativo" },
  { id: uid(), name: "Mercado Pago", bankId: byName(defaultBanks, "Mercado Pago"), limit: 200, closingDay: 8, dueDay: 20, color: "#00a7e1", logo: "", logoText: "MP", status: "ativo" },
];

const defaultPaymentMethods = [
  { id: uid(), name: "Crédito Nubank", type: "crédito", bankId: byName(defaultBanks, "Nubank"), cardId: byName(defaultCards, "Nubank"), color: "#8a05be", icon: "NU", status: "ativo" },
  { id: uid(), name: "Crédito Mercado Pago", type: "crédito", bankId: byName(defaultBanks, "Mercado Pago"), cardId: byName(defaultCards, "Mercado Pago"), color: "#00a7e1", icon: "MP", status: "ativo" },
  { id: uid(), name: "Pix Banco do Brasil", type: "pix", bankId: byName(defaultBanks, "Banco do Brasil"), cardId: "", color: "#f2c94c", icon: "PX", status: "ativo" },
  { id: uid(), name: "Débito Banco do Brasil", type: "débito", bankId: byName(defaultBanks, "Banco do Brasil"), cardId: "", color: "#f2c94c", icon: "BB", status: "ativo" },
  { id: uid(), name: "Pix Banco Inter", type: "pix", bankId: byName(defaultBanks, "Banco Inter"), cardId: "", color: "#f2994a", icon: "PX", status: "ativo" },
  { id: uid(), name: "Débito Banco Inter", type: "débito", bankId: byName(defaultBanks, "Banco Inter"), cardId: "", color: "#f2994a", icon: "BI", status: "ativo" },
  { id: uid(), name: "Dinheiro", type: "dinheiro", bankId: "", cardId: "", color: "#516070", icon: "$", status: "ativo" },
  { id: uid(), name: "Cartão Estudantil (RU)", type: "cartão estudantil", bankId: byName(defaultBanks, "Cartão Estudantil (RU)"), cardId: "", color: "#147a4b", icon: "RU", status: "ativo" },
];

const defaultAccounts = [
  { id: uid(), name: "Conta Banco do Brasil", bankId: byName(defaultBanks, "Banco do Brasil"), type: "corrente", balance: 0, color: "#f2c94c", status: "ativo" },
  { id: uid(), name: "Conta Banco Inter", bankId: byName(defaultBanks, "Banco Inter"), type: "corrente", balance: 0, color: "#f2994a", status: "ativo" },
  { id: uid(), name: "Carteira RU", bankId: byName(defaultBanks, "Cartão Estudantil (RU)"), type: "cartão", balance: 30, color: "#147a4b", status: "ativo" },
];

const catId = (name) => byName(defaultCategories, name);
const payId = (name) => byName(defaultPaymentMethods, name);
const cardId = (name) => byName(defaultCards, name);
const accountId = (name) => byName(defaultAccounts, name);

const defaultState = {
  settings: {
    scholarship: 2100,
    temporaryIncome: 200,
    savingsGoal: 300,
    ruValue: 3,
    ruDays: 20,
    emergencyTarget: 6300,
    variableLimit: 900,
    creditCardLimit: 900,
  },
  configItems: [
    { id: uid(), key: "scholarship", label: "Bolsa mensal", value: 2100, type: "currency", required: true },
    { id: uid(), key: "temporaryIncome", label: "Renda extra", value: 200, type: "currency", required: true },
    { id: uid(), key: "savingsGoal", label: "Meta de reserva mensal", value: 300, type: "currency", required: true },
    { id: uid(), key: "ruValue", label: "Valor do RU", value: 3, type: "currency", required: true },
    { id: uid(), key: "ruDays", label: "Dias de uso do RU por mês", value: 20, type: "number", required: true },
    { id: uid(), key: "variableLimit", label: "Limite mensal desejado para gastos variáveis", value: 900, type: "currency", required: false },
    { id: uid(), key: "creditCardLimit", label: "Limite mensal para cartão de crédito", value: 900, type: "currency", required: false },
  ],
  categories: defaultCategories,
  subcategories: [
    { id: uid(), name: "RU almoço", categoryId: catId("Restaurante Universitário (RU)"), icon: "RU" },
    { id: uid(), name: "Supermercado", categoryId: catId("Alimentação"), icon: "SUP" },
    { id: uid(), name: "Campo e impressão", categoryId: catId("Material Acadêmico"), icon: "AC" },
  ],
  banks: defaultBanks,
  cards: defaultCards,
  paymentMethods: defaultPaymentMethods,
  accounts: defaultAccounts,
  incomes: [
    { id: uid(), name: "Bolsa de mestrado", value: 2100, type: "Fixa", receivedAt: isoDate(today), installments: 0, current: 0, status: "ativa" },
    { id: uid(), name: "Venda JBL", value: 200, type: "Temporária", receivedAt: isoDate(today), installments: 6, current: 1, status: "ativa" },
  ],
  debts: [
    { id: uid(), name: "Aluguel", value: 450, purchaseTotal: 0, cardId: "", total: 0, current: 0, dueDay: 5, status: "ativa" },
    { id: uid(), name: "Marisa", value: 100.79, purchaseTotal: 503.95, cardId: cardId("Nubank"), total: 5, current: 1, dueDay: 10, status: "ativa" },
    { id: uid(), name: "Pernambucanas", value: 80.59, purchaseTotal: 402.95, cardId: cardId("Mercado Pago"), total: 5, current: 1, dueDay: 12, status: "ativa" },
    { id: uid(), name: "Riachuelo", value: 35, purchaseTotal: 280, cardId: cardId("Nubank"), total: 8, current: 1, dueDay: 15, status: "ativa" },
    { id: uid(), name: "Móveis Bruna", value: 125, purchaseTotal: 375, cardId: cardId("Mercado Pago"), total: 3, current: 1, dueDay: 18, status: "ativa" },
    { id: uid(), name: "Mercado Pago", value: 500, purchaseTotal: 0, cardId: cardId("Mercado Pago"), total: 0, current: 0, dueDay: 20, status: "ativa" },
    { id: uid(), name: "Nubank", value: 120.73, purchaseTotal: 0, cardId: cardId("Nubank"), total: 0, current: 0, dueDay: 22, status: "ativa" },
  ],
  expenses: [
    { id: uid(), date: isoDate(today), categoryId: catId("Restaurante Universitário (RU)"), subcategoryId: "", description: "Restaurante Universitário", value: 60, paymentMethodId: payId("Cartão Estudantil (RU)"), accountId: accountId("Carteira RU"), cardId: "", installments: 1, currentInstallment: 1 },
    { id: uid(), date: isoDate(today), categoryId: catId("Alimentação"), subcategoryId: "", description: "Supermercado semanal", value: 600, paymentMethodId: payId("Débito Banco do Brasil"), accountId: accountId("Conta Banco do Brasil"), cardId: "", installments: 1, currentInstallment: 1 },
    { id: uid(), date: isoDate(today), categoryId: catId("Transporte"), subcategoryId: "", description: "Deslocamentos acadêmicos", value: 120, paymentMethodId: payId("Pix Banco do Brasil"), accountId: accountId("Conta Banco do Brasil"), cardId: "", installments: 1, currentInstallment: 1 },
    { id: uid(), date: isoDate(today), categoryId: catId("Material Acadêmico"), subcategoryId: "", description: "Impressões e campo", value: 85, paymentMethodId: payId("Débito Banco Inter"), accountId: accountId("Conta Banco Inter"), cardId: "", installments: 1, currentInstallment: 1 },
  ],
  ruTransactions: [
    { id: uid(), date: isoDate(today), type: "Recarga", description: "Recarga mensal RU", value: 90 },
    { id: uid(), date: isoDate(today), type: "Consumo", description: "Almoços no RU", value: 60 },
  ],
  goals: [
    { id: uid(), name: "Reserva de emergência", target: 6300, saved: 300 },
    { id: uid(), name: "Notebook", target: 3500, saved: 450 },
    { id: uid(), name: "Congressos", target: 1800, saved: 250 },
    { id: uid(), name: "Cursos", target: 900, saved: 120 },
    { id: uid(), name: "Doutorado", target: 5000, saved: 300 },
  ],
};

let state = loadState();
migrateState();
let modalContext = null;

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return clone(defaultState);
  try {
    return JSON.parse(saved);
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  if (suppressSyncSave) return;
  localStorage.setItem("financeiro-academico-local-updated-at", new Date().toISOString());
  scheduleCloudSave();
}

function migrateState() {
  state.settings = { ...defaultState.settings, ...(state.settings || {}) };
  state.configItems = Array.isArray(state.configItems) ? state.configItems : settingsToConfigItems(state.settings);
  for (const key of ["categories", "subcategories", "banks", "cards", "paymentMethods", "accounts", "incomes", "debts", "expenses", "ruTransactions", "goals"]) {
    state[key] = Array.isArray(state[key]) ? state[key] : clone(defaultState[key]);
  }
  mergeDefaults("configItems", defaultState.configItems, "key");
  syncConfigItemsToSettings();
  mergeDefaults("categories", defaultState.categories, "name");
  mergeDefaults("banks", defaultState.banks, "name");
  mergeDefaults("cards", defaultState.cards, "name");
  mergeDefaults("paymentMethods", defaultState.paymentMethods, "name");
  mergeDefaults("accounts", defaultState.accounts, "name");
  state.expenses = state.expenses.map((expense) => ({
    ...expense,
    categoryId: resolveId("categories", expense.categoryId || expense.category, "Alimentação"),
    subcategoryId: resolveId("subcategories", expense.subcategoryId || expense.subcategory, ""),
    paymentMethodId: resolveId("paymentMethods", expense.paymentMethodId || expense.payment, "Pix Banco do Brasil"),
    accountId: resolveId("accounts", expense.accountId || expense.account, ""),
    cardId: resolveId("cards", expense.cardId || expense.card, ""),
    installments: Number(expense.installments || 1),
    currentInstallment: Number(expense.currentInstallment || 1),
  }));
  state.debts = state.debts.map((debt) => ({
    ...debt,
    cardId: resolveId("cards", debt.cardId || debt.card, ""),
    paymentMethodId: resolveId("paymentMethods", debt.paymentMethodId || debt.payment, ""),
    purchaseTotal: Number(debt.purchaseTotal || (debt.total ? debt.total * debt.value : 0)),
    current: Number(debt.current || 0),
    total: Number(debt.total || 0),
  }));
  state.incomes = state.incomes.map((income) => ({
    ...income,
    receivedAt: income.receivedAt || isoDate(today),
    status: income.status || "ativa",
  }));
}

function settingsToConfigItems(settings) {
  return defaultState.configItems.map((item) => ({ ...clone(item), value: settings?.[item.key] ?? item.value }));
}

function syncConfigItemsToSettings() {
  state.configItems.forEach((item) => {
    if (item.key) state.settings[item.key] = Number(item.value || 0);
  });
}

function mergeDefaults(key, defaults, compareKey) {
  const current = state[key].map((item) => item[compareKey]);
  defaults.forEach((item) => {
    if (!current.includes(item[compareKey])) state[key].push(clone(item));
  });
}

function resolveId(listKey, value, fallbackName = "") {
  if (!value) return fallbackName ? byName(state[listKey], fallbackName) : "";
  if (state[listKey].some((item) => item.id === value)) return value;
  return byName(state[listKey], value) || (fallbackName ? byName(state[listKey], fallbackName) : "");
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function active(list) {
  return list.filter((item) => item.status !== "inativo");
}

function activeDebts() {
  return state.debts.filter((debt) => debt.status === "ativa");
}

function findItem(key, id) {
  return state[key].find((item) => item.id === id);
}

function displayName(key, id, fallback = "Não informado") {
  return findItem(key, id)?.name || id || fallback;
}

function ruCreditBalance() {
  return sum(state.ruTransactions, (item) => (item.type === "Recarga" ? Number(item.value) : -Number(item.value)));
}

function cardUsage(cardIdValue) {
  return (
    sum(activeDebts().filter((debt) => debt.cardId === cardIdValue), (debt) => Number(debt.value)) +
    sum(state.expenses.filter((expense) => expense.cardId === cardIdValue), (expense) => Number(expense.value))
  );
}

function cardAvailable(card) {
  return Number(card.limit || 0) - cardUsage(card.id);
}

function calc() {
  const income = sum(state.incomes.filter((item) => item.status !== "encerrada"), (item) => Number(item.value));
  const fixed = sum(activeDebts(), (item) => Number(item.value));
  const variable = sum(state.expenses, (item) => Number(item.value));
  const ruBalance = ruCreditBalance();
  const balance = income - fixed - variable;
  const committed = income ? ((fixed + variable) / income) * 100 : 0;
  const saved = Math.max(0, Math.min(balance, state.settings.savingsGoal));
  const emergencyGoal = state.goals.find((goal) => goal.name === "Reserva de emergência");
  const emergencyProgress = emergencyGoal ? (emergencyGoal.saved / emergencyGoal.target) * 100 : 0;
  return { income, fixed, variable, ruBalance, balance, committed, saved, emergencyProgress };
}

function render() {
  saveState();
  renderMetrics();
  renderCharts();
  renderAlerts();
  renderTables();
  renderGoals();
  renderRegistry();
  renderReport();
  renderBackupStatus();
}

function renderMetrics() {
  const data = calc();
  const metrics = [
    ["Receita total", data.income, "Bolsa, renda temporária e extras"],
    ["Despesas fixas", data.fixed, "Dívidas, parcelas e compromissos"],
    ["Gastos variáveis", data.variable, "Categorias do mês atual"],
    ["Saldo do mês", data.balance, `${data.committed.toFixed(1)}% da renda comprometida`],
    ["Renda comprometida", data.committed, "Limite saudável sugerido: até 80%", "%"],
    ["Valor poupado", data.saved, `Meta mensal: ${currency.format(state.settings.savingsGoal)}`],
    ["Reserva emergencial", data.emergencyProgress, `Meta: ${currency.format(state.settings.emergencyTarget)}`, "%"],
    ["Saldo RU", data.ruBalance, "Créditos disponíveis no cartão estudantil"],
  ];
  document.querySelector("#metricsGrid").innerHTML = metrics
    .map(([label, value, detail, type]) => {
      const formatted = type === "%" ? `${value.toFixed(1)}%` : currency.format(value);
      return `<article class="metric"><span>${esc(label)}</span><strong class="${value < 0 ? "negative" : ""}">${formatted}</strong><small>${esc(detail)}</small></article>`;
    })
    .join("");
}

function categoryRows() {
  return state.categories
    .map((category) => ({
      label: category.name,
      color: category.color,
      value: sum(state.expenses.filter((expense) => expense.categoryId === category.id), (expense) => Number(expense.value)),
    }))
    .filter((item) => item.value > 0);
}

function renderCharts() {
  const byCategory = categoryRows();
  const total = sum(byCategory, (item) => item.value) || 1;
  let angle = 0;
  const gradient = byCategory
    .map((item) => {
      const start = angle;
      const end = angle + (item.value / total) * 360;
      angle = end;
      return `${item.color || "#147a4b"} ${start}deg ${end}deg`;
    })
    .join(", ");
  document.querySelector("#donutChart").style.background = `conic-gradient(${gradient || "#dff4e7 0deg 360deg"})`;
  document.querySelector("#categoryLegend").innerHTML = byCategory
    .map((item) => `<div class="legend-item"><span class="legend-label"><i class="swatch" style="background:${esc(item.color || "#147a4b")}"></i>${esc(item.label)}</span><strong>${currency.format(item.value)}</strong></div>`)
    .join("");
  const top = [...byCategory].sort((a, b) => b.value - a.value)[0];
  document.querySelector("#topCategoryBadge").textContent = top ? `Maior: ${top.label}` : "Sem gastos";

  const data = calc();
  const max = Math.max(data.income, data.fixed + data.variable, 1);
  document.querySelector("#barChart").innerHTML = [
    ["Receitas", data.income, "income"],
    ["Despesas", data.fixed + data.variable, "expense"],
  ]
    .map(([label, value, type]) => `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill ${type}" style="width:${(value / max) * 100}%"></div></div><strong>${currency.format(value)}</strong></div>`)
    .join("");
  renderBarChart("#paymentChart", groupExpenses((expense) => displayName("paymentMethods", expense.paymentMethodId)), "expense");
  renderBarChart("#cardChart", cardDashboardRows(), "income");
  renderInstallmentChart();
  renderLineChart();
}

function groupExpenses(labelFn) {
  const labels = [...new Set(state.expenses.map(labelFn))];
  return labels
    .map((label) => ({ label, value: sum(state.expenses.filter((expense) => labelFn(expense) === label), (expense) => Number(expense.value)) }))
    .sort((a, b) => b.value - a.value);
}

function renderBarChart(selector, rows, type = "income") {
  const max = Math.max(...rows.map((row) => row.value), 1);
  document.querySelector(selector).innerHTML = rows.length
    ? rows.map((row) => `<div class="bar-row"><span title="${esc(row.label)}">${esc(row.label)}</span><div class="bar-track"><div class="bar-fill ${type}" style="width:${(row.value / max) * 100}%"></div></div><strong>${currency.format(row.value)}</strong></div>`).join("")
    : `<p>Nenhum gasto registrado.</p>`;
}

function cardDashboardRows() {
  const cardRows = state.cards.map((card) => ({ label: card.name, value: cardUsage(card.id) }));
  const installmentRows = [{ label: "Parceladas", value: sum(activeDebts().filter((debt) => debt.total), (debt) => Number(debt.value)) }];
  return [...cardRows, ...installmentRows].filter((row) => row.value > 0).sort((a, b) => b.value - a.value);
}

function renderInstallmentChart() {
  const rows = activeDebts()
    .filter((debt) => debt.total)
    .map((debt) => ({
      label: `${debt.name} ${debt.current}/${debt.total}`,
      value: Number(debt.value),
      detail: `${Math.max(debt.total - debt.current + 1, 0)} restantes - ${displayName("cards", debt.cardId, "sem cartão")} - quita ${payoffDate(debt).toLocaleDateString("pt-BR")}`,
    }))
    .sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((row) => row.value), 1);
  document.querySelector("#installmentChart").innerHTML = rows.length
    ? rows.map((row) => `<div class="bar-row"><span title="${esc(row.detail)}">${esc(row.label)}</span><div class="bar-track"><div class="bar-fill expense" style="width:${(row.value / max) * 100}%"></div></div><strong>${currency.format(row.value)}</strong></div>`).join("")
    : `<p>Nenhuma compra parcelada ativa.</p>`;
}

function renderLineChart() {
  const svg = document.querySelector("#lineChart");
  const data = projectBalances();
  const min = Math.min(...data.map((item) => item.balance), 0);
  const max = Math.max(...data.map((item) => item.balance), 1);
  const width = 720;
  const height = 220;
  const pad = 28;
  const points = data.map((item, index) => {
    const x = pad + index * ((width - pad * 2) / (data.length - 1));
    const y = height - pad - ((item.balance - min) / (max - min || 1)) * (height - pad * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  svg.innerHTML = `
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#dbe9e1" />
    <path d="${path}" fill="none" stroke="#147a4b" stroke-width="4" stroke-linecap="round" />
    ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${point.balance < 0 ? "#c0392b" : "#147a4b"}"><title>${point.month}: ${currency.format(point.balance)}</title></circle>`).join("")}
    ${points.map((point) => `<text x="${point.x}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#6f7d75">${point.month}</text>`).join("")}
  `;
}

function projectBalances() {
  const base = calc();
  return Array.from({ length: 6 }, (_, index) => {
    const parcelRelief = sum(state.debts.filter((debt) => debt.total && debt.current + index > debt.total), (debt) => Number(debt.value));
    const tempIncomeDrop = state.incomes.some((income) => income.status !== "encerrada" && income.type === "Temporária" && income.installments && income.current + index > income.installments) ? Number(state.settings.temporaryIncome) : 0;
    const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
    return { month: date.toLocaleDateString("pt-BR", { month: "short" }), balance: base.balance + parcelRelief - tempIncomeDrop };
  });
}

function renderAlerts() {
  const data = calc();
  const upcoming = activeDebts().filter((debt) => debt.dueDay >= today.getDate() && debt.dueDay - today.getDate() <= 5);
  const alerts = [];
  if (data.balance < 0) alerts.push(`<div class="alert danger">Saldo negativo de ${currency.format(Math.abs(data.balance))}. Revise a maior categoria variável antes de assumir novos gastos.</div>`);
  if (data.committed > 80) alerts.push(`<div class="alert">A renda comprometida está em ${data.committed.toFixed(1)}%. Priorize quitação de parcelas curtas para liberar caixa.</div>`);
  if (state.settings.variableLimit && data.variable > state.settings.variableLimit) alerts.push(`<div class="alert">Gastos variáveis acima do limite desejado: ${currency.format(data.variable)} de ${currency.format(state.settings.variableLimit)}.</div>`);
  const creditUsage = sum(cardDashboardRows().filter((row) => row.label !== "Parceladas"), (row) => row.value);
  if (state.settings.creditCardLimit && creditUsage > state.settings.creditCardLimit) alerts.push(`<div class="alert">Uso de cartão acima do limite mensal definido: ${currency.format(creditUsage)} de ${currency.format(state.settings.creditCardLimit)}.</div>`);
  if (data.ruBalance < state.settings.ruValue * 3) alerts.push(`<div class="alert">Saldo do RU baixo: ${currency.format(data.ruBalance)}. Planeje uma recarga para evitar gasto maior com alimentação fora do campus.</div>`);
  if (upcoming.length) alerts.push(`<div class="alert">Vencimentos próximos: ${upcoming.map((debt) => `${esc(debt.name)} dia ${debt.dueDay}`).join(", ")}.</div>`);
  document.querySelector("#alertStrip").innerHTML = alerts.join("");
}

function renderTables() {
  renderSettings();
  document.querySelector("#incomeTable").innerHTML = state.incomes.map(incomeRow).join("");
  document.querySelector("#debtTable").innerHTML = state.debts.map(debtRow).join("");
  document.querySelector("#expenseTable").innerHTML = state.expenses.map(expenseRow).join("");
  document.querySelector("#ruTable").innerHTML = state.ruTransactions.map(ruRow).join("");
  renderRuSummary();
  renderTimeline();
}

function renderSettings() {
  document.querySelector("#settingsForm").innerHTML = state.configItems
    .map((item) => `<article class="entity-item"><div><strong>${esc(item.label)}</strong><small>${formatConfigValue(item)}</small></div>${actions("configItems", item.id)}</article>`)
    .join("");
}

function formatConfigValue(item) {
  if (item.type === "number") return `${Number(item.value || 0)}${item.key === "ruDays" ? " dias" : ""}`;
  return currency.format(Number(item.value || 0));
}

function actions(key, id) {
  return `<div class="row-actions"><button class="secondary-button" data-edit="${key}" data-id="${id}" type="button">✏️ Editar</button><button class="icon-button" data-remove="${key}" data-id="${id}" title="Excluir" type="button">🗑️</button></div>`;
}

function logo(item, fallback = "?") {
  const color = item?.color || "#dff4e7";
  if (item?.logo) return `<span class="logo-chip" style="background:${esc(color)}"><img alt="" src="${esc(item.logo)}"></span>`;
  return `<span class="logo-chip" style="background:${esc(color)}">${esc(item?.logoText || item?.icon || fallback)}</span>`;
}

function incomeRow(item) {
  return `<tr><td>${esc(item.name)}</td><td>${currency.format(item.value)}</td><td>${esc(item.type)}</td><td>${formatDate(item.receivedAt || isoDate(today))}</td><td>${esc(item.status || "ativa")}</td><td>${item.installments ? `${item.current}/${item.installments}` : "Recorrente"}</td><td>${actions("incomes", item.id)}</td></tr>`;
}

function debtRow(item) {
  const card = findItem("cards", item.cardId);
  const payment = findItem("paymentMethods", item.paymentMethodId);
  const isDue = item.status === "ativa" && item.dueDay >= today.getDate() && item.dueDay - today.getDate() <= 5;
  const statusClass = item.status === "quitada" ? "done" : isDue ? "due" : "";
  const installment = item.total ? `${item.current}/${item.total}` : "Recorrente";
  const remaining = item.total ? Math.max(item.total - item.current + 1, 0) : 0;
  const payoff = item.total ? payoffDate(item).toLocaleDateString("pt-BR") : "Recorrente";
  return `<tr><td>${esc(item.name)}</td><td>${currency.format(item.value)}</td><td>${item.purchaseTotal ? currency.format(item.purchaseTotal) : "Recorrente"}</td><td><span class="name-cell">${logo(payment, "P")}${esc(payment?.name || "Não informado")}</span></td><td><span class="name-cell">${logo(card, "CC")}${esc(card?.name || "Não se aplica")}</span></td><td>${installment}<br><small>${remaining} restante(s)</small></td><td>${payoff}</td><td><button class="status ${statusClass}" data-pay="${item.id}" type="button">${esc(item.status)}</button></td><td>${actions("debts", item.id)}</td></tr>`;
}

function expenseRow(item) {
  const category = findItem("categories", item.categoryId);
  const subcategory = findItem("subcategories", item.subcategoryId);
  const payment = findItem("paymentMethods", item.paymentMethodId);
  const account = findItem("accounts", item.accountId);
  const card = findItem("cards", item.cardId);
  return `<tr><td>${formatDate(item.date)}</td><td><span class="name-cell">${logo(category, "C")}${esc(category?.name || "Categoria")}</span></td><td>${esc(subcategory?.name || "-")}</td><td>${esc(item.description)}</td><td><span class="name-cell">${logo(payment, "P")}${esc(payment?.name || "Pagamento")}</span></td><td>${esc(account?.name || "-")}</td><td>${esc(card?.name || "-")}</td><td>${item.installments || 1}x</td><td>${currency.format(item.value)}</td><td>${actions("expenses", item.id)}</td></tr>`;
}

function ruRow(item) {
  return `<tr><td>${formatDate(item.date)}</td><td>${esc(item.type)}</td><td>${esc(item.description)}</td><td>${currency.format(item.value)}</td><td>${actions("ruTransactions", item.id)}</td></tr>`;
}

function renderRuSummary() {
  const recharge = sum(state.ruTransactions.filter((item) => item.type === "Recarga"), (item) => Number(item.value));
  const consumption = sum(state.ruTransactions.filter((item) => item.type === "Consumo"), (item) => Number(item.value));
  document.querySelector("#ruSummary").innerHTML = `
    <article class="ru-card"><span>Recargas</span><strong>${currency.format(recharge)}</strong></article>
    <article class="ru-card"><span>Consumo</span><strong>${currency.format(consumption)}</strong></article>
    <article class="ru-card"><span>Saldo</span><strong class="${ruCreditBalance() < 0 ? "negative" : ""}">${currency.format(ruCreditBalance())}</strong></article>
  `;
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function renderTimeline() {
  const items = state.debts
    .filter((debt) => debt.status === "ativa")
    .map((debt) => ({ ...debt, remaining: debt.total ? Math.max(debt.total - debt.current + 1, 0) : 1, date: debt.total ? payoffDate(debt) : new Date(today.getFullYear(), today.getMonth(), debt.dueDay) }))
    .sort((a, b) => a.date - b.date);
  document.querySelector("#timeline").innerHTML = items
    .map((item) => `<div class="timeline-item"><div><strong>${esc(item.name)}</strong><br><small>${item.total ? `${item.remaining} parcela(s) restante(s)` : "Compromisso recorrente"}</small></div><span>${formatDate(isoDate(item.date))}</span></div>`)
    .join("");
}

function payoffDate(debt) {
  const remaining = debt.total ? Math.max(debt.total - debt.current + 1, 0) : 0;
  return new Date(today.getFullYear(), today.getMonth() + Math.max(remaining - 1, 0), debt.dueDay);
}

function renderGoals() {
  document.querySelector("#goalGrid").innerHTML = state.goals
    .map((goal) => {
      const pct = Math.min((goal.saved / goal.target) * 100, 100);
      return `<article class="goal-card"><div class="panel-header"><h3>${esc(goal.name)}</h3>${actions("goals", goal.id)}</div><p>${currency.format(goal.saved)} de ${currency.format(goal.target)}</p><div class="progress"><span style="width:${pct}%"></span></div><small>${pct.toFixed(1)}% concluído</small></article>`;
    })
    .join("");
}

function renderRegistry() {
  renderEntityList("categoryList", "categories", (item) => `${logo(item, "C")}<div><strong>${esc(item.name)}</strong><small>${esc(item.icon || "")} · ${esc(item.color || "")}</small></div>`);
  renderEntityList("subcategoryList", "subcategories", (item) => `${logo(item, "S")}<div><strong>${esc(item.name)}</strong><small>${esc(displayName("categories", item.categoryId))}</small></div>`);
  renderEntityList("paymentMethodList", "paymentMethods", (item) => `${logo(item, "P")}<div><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${esc(displayName("banks", item.bankId, "sem banco"))}</small></div>`);
  renderEntityList("bankList", "banks", (item) => `${logo(item, "B")}<div><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${currency.format(item.balance || 0)} · ${esc(item.status)}</small></div>`);
  renderEntityList("cardList", "cards", (item) => `${logo(item, "CC")}<div><strong>${esc(item.name)}</strong><small>${esc(displayName("banks", item.bankId))} · limite ${currency.format(item.limit || 0)} · disponível ${currency.format(cardAvailable(item))}</small></div>`);
  renderEntityList("accountList", "accounts", (item) => `${logo(item, "C")}<div><strong>${esc(item.name)}</strong><small>${esc(displayName("banks", item.bankId))} · ${esc(item.type)} · ${currency.format(item.balance || 0)} · ${esc(item.status)}</small></div>`);
}

function renderEntityList(targetId, key, template) {
  document.querySelector(`#${targetId}`).innerHTML = state[key]
    .map((item) => `<article class="entity-item"><div class="entity-main">${template(item)}</div>${actions(key, item.id)}</article>`)
    .join("");
}

function renderReport() {
  const data = calc();
  const byCategory = categoryRows().sort((a, b) => b.value - a.value);
  const top = byCategory[0] || { label: "Sem categoria", value: 0 };
  const topPayment = groupExpenses((expense) => displayName("paymentMethods", expense.paymentMethodId))[0] || { label: "Sem forma de pagamento", value: 0 };
  const topCard = cardDashboardRows()[0] || { label: "Sem cartão", value: 0 };
  const economy = top.value * 0.15;
  const debtMonths = Math.ceil(sum(activeDebts(), (debt) => (debt.total ? Math.max(debt.total - debt.current + 1, 0) * debt.value : debt.value)) / Math.max(data.saved + economy, 1));
  document.querySelector("#reportDate").textContent = new Date().toLocaleDateString("pt-BR", { dateStyle: "long" });
  document.querySelector("#smartReport").innerHTML = `
    <article class="report-card"><strong>Maior categoria</strong><p>${esc(top.label)} concentra ${currency.format(top.value)} neste mês.</p></article>
    <article class="report-card"><strong>Forma de pagamento</strong><p>${esc(topPayment.label)} concentra ${currency.format(topPayment.value)} dos gastos variáveis.</p></article>
    <article class="report-card"><strong>Cartões</strong><p>${esc(topCard.label)} é o maior ponto de atenção em cartões/parcelados, com ${currency.format(topCard.value)}.</p></article>
    <article class="report-card"><strong>Economia potencial</strong><p>Reduzindo 15% em ${esc(top.label)}, você economiza ${currency.format(economy)} por mês e ${currency.format(economy * 12)} por ano.</p></article>
    <article class="report-card"><strong>Saldo mensal</strong><p>${data.balance < 0 ? "Atenção: saldo negativo" : "Saldo positivo"} de ${currency.format(data.balance)} após compromissos.</p></article>
    <article class="report-card"><strong>Quitação de dívidas</strong><p>Direcionando economia e poupança, a pressão das dívidas pode cair em cerca de ${debtMonths} mês(es).</p></article>
    <article class="report-card"><strong>RU e alimentação</strong><p>Saldo atual do RU: ${currency.format(data.ruBalance)}. O consumo mensal planejado é ${currency.format(state.settings.ruValue * state.settings.ruDays)}.</p></article>
    <article class="report-card"><strong>Recomendação</strong><p>Edite categorias, cartões e bancos sempre que sua rotina mudar; o dashboard recalcula automaticamente.</p></article>
  `;
}

function renderBackupStatus() {
  const target = document.querySelector("#localStorageStatus");
  if (!target) return;
  const bytes = new Blob([localStorage.getItem(storageKey) || ""]).size;
  const date = new Date().toLocaleString("pt-BR");
  target.textContent = `Dados locais ativos · ${(bytes / 1024).toFixed(1)} KB · ${date}`;
  renderDriveStatus();
}

function renderDriveStatus() {
  const top = document.querySelector("#syncStatus");
  const details = document.querySelector("#driveStatusDetails");
  if (top) top.textContent = driveStatus.status;
  if (details) {
    const last = driveStatus.lastSyncAt ? new Date(driveStatus.lastSyncAt).toLocaleString("pt-BR") : "Nunca";
    details.textContent = `${driveStatus.status}. Última sincronização: ${last}. ${driveStatus.connected ? "Conta Google conectada." : "Modo local disponível sem login."}`;
  }
}

const modalConfigs = {
  configItems: { title: "Item de configuração", required: ["label", "key"], fields: [["label", "Nome do item", "text"], ["key", "Chave interna", "text"], ["value", "Valor", "number"], ["type", "Tipo", "select", ["currency", "number"]]] },
  incomes: { title: "Receita", required: ["name"], fields: [["name", "Nome", "text"], ["value", "Valor", "number"], ["type", "Tipo", "select", ["Fixa", "Temporária", "Eventual"]], ["receivedAt", "Data de recebimento", "date"], ["installments", "Quantidade de parcelas", "number"], ["current", "Parcela atual", "number"], ["status", "Status", "select", ["ativa", "encerrada"]]] },
  debts: { title: "Dívida ou compra parcelada", required: ["name"], fields: [["name", "Despesa", "text"], ["value", "Valor", "number"], ["purchaseTotal", "Valor total", "number"], ["paymentMethodId", "Forma de pagamento", "select", () => optionList("paymentMethods", true)], ["cardId", "Cartão", "select", () => optionList("cards", true)], ["total", "Número total de parcelas", "number"], ["current", "Parcela atual", "number"], ["dueDay", "Data de vencimento", "number"], ["status", "Status", "select", ["ativa", "quitada"]]] },
  expenses: { title: "Gasto variável", fields: [["date", "Data", "date"], ["categoryId", "Categoria", "select", () => optionList("categories")], ["subcategoryId", "Subcategoria", "select", () => optionList("subcategories", true)], ["description", "Descrição", "text"], ["value", "Valor", "number"], ["paymentMethodId", "Pagamento", "select", () => optionList("paymentMethods")], ["accountId", "Conta", "select", () => optionList("accounts", true)], ["cardId", "Cartão", "select", () => optionList("cards", true)], ["installments", "Parcelas", "number"], ["currentInstallment", "Parcela atual", "number"]] },
  ruTransactions: { title: "Movimento do RU", fields: [["date", "Data", "date"], ["type", "Tipo", "select", ["Recarga", "Consumo"]], ["description", "Descrição", "text"], ["value", "Valor", "number"]] },
  goals: { title: "Meta financeira", fields: [["name", "Meta", "text"], ["target", "Valor alvo", "number"], ["saved", "Valor guardado", "number"]] },
  categories: { title: "Categoria", fields: [["name", "Nome", "text"], ["icon", "Ícone ou sigla", "text"], ["color", "Cor", "color"]] },
  subcategories: { title: "Subcategoria", fields: [["name", "Nome", "text"], ["categoryId", "Categoria vinculada", "select", () => optionList("categories")], ["icon", "Ícone ou sigla", "text"]] },
  paymentMethods: { title: "Forma de pagamento", fields: [["name", "Nome", "text"], ["type", "Tipo", "select", ["crédito", "débito", "pix", "dinheiro", "cartão estudantil", "carteira digital"]], ["bankId", "Banco", "select", () => optionList("banks", true)], ["cardId", "Cartão", "select", () => optionList("cards", true)], ["icon", "Ícone ou sigla", "text"], ["color", "Cor", "color"], ["status", "Status", "select", ["ativo", "inativo"]]] },
  banks: { title: "Banco", fields: [["name", "Nome do banco", "text"], ["type", "Tipo", "select", ["corrente", "poupança", "cartão", "carteira digital"]], ["balance", "Saldo inicial", "number"], ["color", "Cor", "color"], ["logoText", "Ícone padrão", "text"], ["logo", "Logo personalizada", "file"], ["status", "Status", "select", ["ativo", "inativo"]]] },
  cards: { title: "Cartão de crédito", fields: [["name", "Nome do cartão", "text"], ["bankId", "Banco emissor", "select", () => optionList("banks")], ["limit", "Limite total", "number"], ["closingDay", "Dia de fechamento", "number"], ["dueDay", "Dia de vencimento", "number"], ["color", "Cor", "color"], ["logoText", "Ícone padrão", "text"], ["logo", "Logo", "file"], ["status", "Status", "select", ["ativo", "inativo"]]] },
  accounts: { title: "Conta bancária", fields: [["name", "Nome da conta", "text"], ["bankId", "Banco", "select", () => optionList("banks")], ["type", "Tipo", "select", ["corrente", "poupança", "cartão", "carteira digital"]], ["balance", "Saldo inicial", "number"], ["color", "Cor", "color"], ["status", "Status", "select", ["ativo", "inativo"]]] },
};

function optionList(key, includeBlank = false) {
  const items = active(state[key]).map((item) => ({ label: item.name, value: item.id }));
  return includeBlank ? [{ label: "Não se aplica", value: "" }, ...items] : items;
}

function openModal(entity, id = null, settingKey = null) {
  modalContext = { entity, id, settingKey };
  const title = settingKey ? "Configuração do aplicativo" : modalConfigs[entity].title;
  const item = settingKey ? { value: state.settings[settingKey] } : id ? clone(findItem(entity, id)) : defaultsFor(entity);
  document.querySelector("#modalTitle").textContent = `${id || settingKey ? "Editar" : "Adicionar"} ${title}`;
  document.querySelector("#modalForm").innerHTML = settingKey ? settingForm(settingKey, item.value) : fieldsHtml(entity, item);
  document.querySelector("#modalBackdrop").hidden = false;
}

function defaultsFor(entity) {
  const base = { id: uid(), color: "#147a4b", status: "ativo" };
  const byEntity = {
    configItems: { label: "", key: "", value: 0, type: "currency" },
    incomes: { name: "", value: 0, type: "Fixa", receivedAt: isoDate(today), installments: 0, current: 1, status: "ativa" },
    debts: { name: "", value: 0, purchaseTotal: 0, paymentMethodId: "", cardId: "", total: 0, current: 1, dueDay: 10, status: "ativa" },
    expenses: { date: isoDate(today), categoryId: state.categories[0]?.id || "", subcategoryId: "", description: "", value: 0, paymentMethodId: state.paymentMethods[0]?.id || "", accountId: "", cardId: "", installments: 1, currentInstallment: 1 },
    ruTransactions: { date: isoDate(today), type: "Recarga", description: "", value: 0 },
    goals: { name: "", target: 0, saved: 0 },
    categories: { name: "", icon: "", color: "#147a4b" },
    subcategories: { name: "", categoryId: state.categories[0]?.id || "", icon: "" },
    paymentMethods: { name: "", type: "pix", bankId: "", cardId: "", icon: "", color: "#147a4b", status: "ativo" },
    banks: { name: "", type: "corrente", logo: "", logoText: "B", balance: 0, color: "#147a4b", status: "ativo" },
    cards: { name: "", bankId: state.banks[0]?.id || "", limit: 0, closingDay: 1, dueDay: 10, color: "#147a4b", logo: "", logoText: "CC", status: "ativo" },
    accounts: { name: "", bankId: state.banks[0]?.id || "", type: "corrente", balance: 0, color: "#147a4b", status: "ativo" },
  };
  return { ...base, ...byEntity[entity] };
}

function fieldsHtml(entity, item) {
  return modalConfigs[entity].fields.map(([name, label, type, options]) => fieldHtml(name, label, type, item[name], typeof options === "function" ? options() : options)).join("") + modalActions();
}

function settingForm(key, value) {
  return fieldHtml("value", "Valor", "number", value) + modalActions();
}

function fieldHtml(name, label, type, value, options = []) {
  const full = type === "file" ? " full" : "";
  if (type === "select") {
    const normalized = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
    return `<div class="field${full}"><label for="modal-${name}">${esc(label)}</label><select id="modal-${name}" name="${name}">${normalized.map((option) => `<option value="${esc(option.value)}" ${String(option.value) === String(value ?? "") ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select></div>`;
  }
  if (type === "file") {
    return `<div class="field${full}"><label for="modal-${name}">${esc(label)}</label><input id="modal-${name}" name="${name}" type="file" accept="image/*"><span class="file-hint">Opcional. Se vazio, o ícone padrão será usado.</span></div>`;
  }
  return `<div class="field${full}"><label for="modal-${name}">${esc(label)}</label><input id="modal-${name}" name="${name}" type="${type}" value="${esc(value ?? "")}" ${type === "number" ? 'step="0.01" min="0"' : ""}></div>`;
}

function modalActions() {
  return `<div class="modal-message" id="modalMessage" aria-live="polite"></div><div class="modal-actions"><button class="ghost-button" id="cancelModal" type="button">Cancelar</button><button class="primary-button" type="submit">Salvar</button></div>`;
}

async function readFile(input) {
  const file = input.files?.[0];
  if (!file) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function submitModal(event) {
  event.preventDefault();
  if (!modalContext) return;
  const form = event.target;
  const fd = new FormData(form);
  if (modalContext.settingKey) {
    state.settings[modalContext.settingKey] = Number(fd.get("value"));
    syncSettingsToIncome(modalContext.settingKey);
    closeModal();
    render();
    return;
  }
  const entity = modalContext.entity;
  const config = modalConfigs[entity];
  const validation = validateModal(form, config);
  if (!validation.ok) {
    showModalMessage(validation.message, "error");
    return;
  }
  const original = modalContext.id ? clone(findItem(entity, modalContext.id)) : defaultsFor(entity);
  const item = { ...original };
  for (const [name, , type] of config.fields) {
    if (type === "file") {
      const dataUrl = await readFile(form.elements[name]);
      if (dataUrl) item[name] = dataUrl;
      continue;
    }
    const value = fd.get(name);
    item[name] = type === "number" ? Number(value || 0) : value;
  }
  if (entity === "expenses") maybeCreateRuConsumption(item);
  if (entity === "configItems") syncConfigItemToSettings(item);
  if (modalContext.id) {
    const index = state[entity].findIndex((entry) => entry.id === modalContext.id);
    state[entity][index] = item;
  } else {
    state[entity].push(item);
  }
  syncConfigItemsToSettings();
  closeModal();
  render();
  notify("Registro salvo com sucesso.");
}

function validateModal(form, config) {
  const required = config.required || [];
  for (const name of required) {
    if (!String(form.elements[name]?.value || "").trim()) return { ok: false, message: "Preencha os campos obrigatórios." };
  }
  for (const input of form.querySelectorAll('input[type="number"]')) {
    if (Number(input.value || 0) < 0) return { ok: false, message: "Valores negativos não são permitidos neste campo." };
  }
  return { ok: true };
}

function showModalMessage(message, type = "info") {
  const target = document.querySelector("#modalMessage");
  if (!target) return;
  target.textContent = message;
  target.className = `modal-message ${type}`;
}

function notify(message) {
  const target = document.querySelector("#appToast");
  if (!target) return alert(message);
  target.textContent = message;
  target.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    target.hidden = true;
  }, 2600);
}

function syncConfigItemToSettings(item) {
  if (!item.key) return;
  state.settings[item.key] = Number(item.value || 0);
}

function maybeCreateRuConsumption(expense) {
  const payment = findItem("paymentMethods", expense.paymentMethodId);
  if (payment?.name !== "Cartão Estudantil (RU)" || modalContext.id) return;
  state.ruTransactions.push({ id: uid(), date: expense.date, type: "Consumo", description: expense.description || "Consumo RU", value: Number(expense.value) });
}

function syncSettingsToIncome(key) {
  const scholarship = state.incomes.find((item) => item.name === "Bolsa de mestrado");
  const temporary = state.incomes.find((item) => item.name === "Venda JBL");
  if (key === "scholarship" && scholarship) scholarship.value = Number(state.settings[key]);
  if (key === "temporaryIncome" && temporary) temporary.value = Number(state.settings[key]);
}

function closeModal() {
  modalContext = null;
  document.querySelector("#modalBackdrop").hidden = true;
  document.querySelector("#modalForm").innerHTML = "";
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest(".nav-tab");
  if (tab) {
    document.querySelectorAll(".nav-tab, .section").forEach((el) => el.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.section}`).classList.add("active");
  }
  const add = event.target.closest("[data-add]");
  if (add) openModal(add.dataset.add);
  const edit = event.target.closest("[data-edit]");
  if (edit) openModal(edit.dataset.edit, edit.dataset.id);
  const editSetting = event.target.closest("[data-edit-setting]");
  if (editSetting) openModal(null, null, editSetting.dataset.editSetting);
  const remove = event.target.closest("[data-remove]");
  if (remove && confirm("Tem certeza que deseja excluir este item? Essa ação não poderá ser desfeita.")) {
    state[remove.dataset.remove] = state[remove.dataset.remove].filter((item) => item.id !== remove.dataset.id);
    syncConfigItemsToSettings();
    render();
    notify("Item excluído com sucesso.");
  }
  const pay = event.target.closest("[data-pay]");
  if (pay) {
    const debt = state.debts.find((item) => item.id === pay.dataset.pay);
    if (debt.total && debt.current < debt.total) debt.current += 1;
    else debt.status = debt.status === "ativa" ? "quitada" : "ativa";
    if (debt.total && debt.current > debt.total) debt.status = "quitada";
    render();
  }
  if (event.target.id === "closeModal" || event.target.id === "cancelModal" || event.target.id === "modalBackdrop") closeModal();
});

document.querySelector("#modalForm").addEventListener("submit", submitModal);
document.querySelector("#resetData").addEventListener("click", () => {
  if (!confirm("Restaurar todos os dados iniciais?")) return;
  state = clone(defaultState);
  migrateState();
  render();
});
document.querySelectorAll("#printReport, #exportPdf2").forEach((button) => button.addEventListener("click", () => window.print()));
document.querySelectorAll("#exportExcel, #exportExcel2").forEach((button) => button.addEventListener("click", exportExcel));
document.querySelector("#exportCsv").addEventListener("click", exportCsv);
document.querySelector("#exportJson").addEventListener("click", exportJsonBackup);
document.querySelector("#importJsonButton").addEventListener("click", () => document.querySelector("#importJsonInput").click());
document.querySelector("#importJsonInput").addEventListener("change", importJsonBackup);
document.querySelector("#backupExcel").addEventListener("click", exportExcel);
document.querySelector("#backupPdf").addEventListener("click", () => window.print());
document.querySelector("#installPwa").addEventListener("click", installPwa);
document.querySelector("#driveLogin").addEventListener("click", () => window.GoogleDriveSync?.signIn());
document.querySelector("#driveLogout").addEventListener("click", () => window.GoogleDriveSync?.signOut());
document.querySelector("#driveSyncNow").addEventListener("click", () => window.GoogleDriveSync?.syncNow());
document.querySelector("#driveRestore").addEventListener("click", () => window.GoogleDriveSync?.restoreFromDrive());

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#installPwa").disabled = false;
});

function exportCsv() {
  const rows = [["Tipo", "Nome/Data", "Categoria", "Subcategoria", "Descrição", "Pagamento", "Conta", "Cartão", "Parcelas", "Valor"]];
  state.incomes.forEach((item) => rows.push(["Receita", item.name, item.type, "", "", "", "", "", item.installments || "recorrente", item.value]));
  state.debts.forEach((item) => rows.push(["Dívida", item.name, item.status, "", `${item.current}/${item.total || "recorrente"}`, "", "", displayName("cards", item.cardId, ""), item.total || "recorrente", item.value]));
  state.expenses.forEach((item) => rows.push(["Gasto", item.date, displayName("categories", item.categoryId), displayName("subcategories", item.subcategoryId, ""), item.description, displayName("paymentMethods", item.paymentMethodId), displayName("accounts", item.accountId, ""), displayName("cards", item.cardId, ""), item.installments || 1, item.value]));
  state.ruTransactions.forEach((item) => rows.push(["RU", item.date, item.type, "", item.description, "Cartão Estudantil (RU)", "Carteira RU", "", "", item.value]));
  download("financeiro-academico.csv", rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\n"), "text/csv;charset=utf-8");
}

function exportExcel() {
  const html = `<html><head><meta charset="UTF-8"></head><body>${document.querySelector("#reportContent").outerHTML}<h2>Receitas</h2>${tableHtml("#incomeTable")}<h2>Dívidas</h2>${tableHtml("#debtTable")}<h2>Gastos</h2>${tableHtml("#expenseTable")}<h2>RU</h2>${tableHtml("#ruTable")}</body></html>`;
  download("financeiro-academico.xls", html, "application/vnd.ms-excel");
}

function exportJsonBackup() {
  const payload = {
    app: "Financeiro Acadêmico",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
  download(`financeiro-academico-backup-${isoDate(new Date())}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function importJsonBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const importedState = payload.state || payload.appState || payload;
      if (!importedState || typeof importedState !== "object") throw new Error("Arquivo inválido");
      if (!confirm("Importar este backup e substituir os dados atuais deste dispositivo?")) return;
      state = importedState;
      migrateState();
      render();
      alert("Backup importado com sucesso.");
    } catch (error) {
      alert("Não foi possível importar o backup JSON.");
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

async function installPwa() {
  if (!deferredInstallPrompt) {
    alert("Quando disponível, use o menu do navegador e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
}

function tableHtml(selector) {
  return `<table>${document.querySelector(selector).closest("table").innerHTML}</table>`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

initLocalMode();

suppressSyncSave = true;
render();
suppressSyncSave = false;

function initLocalMode() {
  document.querySelector("#loginScreen").hidden = true;
  document.querySelector(".app-shell").hidden = false;
  document.querySelector("#userPanel").hidden = true;
  driveStatus.status = navigator.onLine ? "Modo local" : "Offline";
  renderDriveStatus();
  window.addEventListener("online", () => {
    if (!driveStatus.connected) driveStatus.status = "Modo local";
    renderDriveStatus();
  });
  window.addEventListener("offline", () => {
    driveStatus.status = "Offline";
    renderDriveStatus();
  });
  initDriveSync();
}

function initDriveSync() {
  if (!window.GoogleDriveSync) return;
  scheduleCloudSave = window.GoogleDriveSync.scheduleSave;
  window.GoogleDriveSync.init({
    getState: () => clone(state),
    applyState: (remoteState) => {
      state = remoteState;
      migrateState();
      suppressSyncSave = true;
      render();
      suppressSyncSave = false;
    },
    onStatus: (nextStatus) => {
      driveStatus = { ...driveStatus, ...nextStatus };
      renderDriveStatus();
    },
    onUser: (user) => {
      const panel = document.querySelector("#userPanel");
      if (!user) {
        panel.hidden = true;
        driveStatus.connected = false;
        renderDriveStatus();
        return;
      }
      panel.hidden = false;
      document.querySelector("#userPhoto").src = user.photo || "";
      document.querySelector("#userName").textContent = user.name || "Conta Google";
      document.querySelector("#userEmail").textContent = user.email || "";
      driveStatus.connected = true;
      renderDriveStatus();
    },
  });
}
