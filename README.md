# Financeiro Acadêmico

Aplicativo web/PWA de controle financeiro pessoal para Emanuelle Torres Leal, mestranda em Engenharia Florestal. Funciona gratuitamente no computador e no celular, sem Play Store.

## Uso no Computador

Opção mais simples:

1. Abra `index.html` no Chrome, Edge ou Firefox.
2. Use o app normalmente.
3. Os dados ficam salvos no `localStorage` do navegador.

Opção recomendada para instalar como PWA:

```bash
npx serve .
```

Depois abra a URL mostrada no terminal, normalmente `http://localhost:3000`.

Alternativas de servidor local:

```bash
python -m http.server 8080
npx http-server .
```

## Instalar como PWA no Celular

1. Sirva o app por uma URL local ou pública.
2. Abra a URL no Chrome do Android.
3. Toque no menu do navegador.
4. Escolha **Adicionar à tela inicial** ou **Instalar aplicativo**.
5. Abra o **Financeiro Acadêmico** pelo ícone criado.

Essa alternativa não precisa de Play Store nem APK.

## Gerar APK Android sem Play Store

Este projeto já inclui `package.json` e `capacitor.config.json` para usar Capacitor.

Comandos:

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Financeiro Acadêmico" "com.emanuelle.financeiroacademico"
npx cap add android
npx cap copy android
npx cap open android
```

No Android Studio:

1. Aguarde o Gradle sincronizar.
2. Para APK debug: use **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Para release assinado: use **Build > Generate Signed Bundle / APK**.
4. O APK debug normalmente fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Instalar o APK no Celular

1. Gere o APK no Android Studio.
2. Copie o arquivo `.apk` para o celular.
3. No Android, ative **Instalar apps desconhecidos** para o app usado para abrir o APK.
4. Toque no arquivo `.apk`.
5. Confirme a instalação.
6. Abra o **Financeiro Acadêmico**.

## Backup e Transferência de Dados

Sem banco em nuvem, os dados ficam no dispositivo usado. Para transferir dados entre computador e celular:

1. No app, abra **Backup**.
2. Clique em **Exportar backup JSON**.
3. Envie o arquivo `.json` para o outro dispositivo.
4. No outro dispositivo, abra **Backup**.
5. Clique em **Importar backup JSON**.

Também continuam disponíveis:

- Exportar CSV
- Exportar Excel
- Exportar PDF

Mensagem de privacidade exibida no app:

> Seus dados ficam salvos apenas neste dispositivo, a menos que você exporte um backup manualmente.

## PWA

Configuração atual:

- Nome: Financeiro Acadêmico
- Short name: Financeiro
- Display: standalone
- Theme color: verde
- Background color: branco
- Ícones: `icon.svg`, `icon-192.svg`, `icon-512.svg`
- Offline: `sw.js` com cache dos arquivos estáticos
- Instalação: botão **Instalar aplicativo** na seção **Backup**

## Recursos

- Dashboard com indicadores financeiros, gráfico por categoria, receita vs despesas e projeção de saldo.
- Receitas, dívidas, compras parceladas, gastos variáveis e metas.
- Categorias, subcategorias, formas de pagamento, bancos, cartões e contas editáveis.
- Controle de créditos do RU com recargas, consumo e saldo.
- Cronograma de quitação.
- Relatórios inteligentes.
- Backup JSON para migração manual.
- Funcionamento offline como PWA.

## Firebase Opcional

Os arquivos `firebase-config.js`, `auth.js`, `cloud-sync.js`, `firebase.rules` e `firebase.json` permanecem no projeto caso você queira ativar sincronização em nuvem no futuro. Para uso local gratuito, eles não são necessários.
