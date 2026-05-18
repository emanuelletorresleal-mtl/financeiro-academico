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

Sem login Google, os dados ficam no dispositivo usado. Para transferir dados manualmente entre computador e celular:

1. No app, abra **Backup**.
2. Clique em **Exportar backup JSON**.
3. Envie o arquivo `.json` para o outro dispositivo.
4. No outro dispositivo, abra **Backup**.
5. Clique em **Importar backup JSON**.

Também continuam disponíveis:

- Exportar CSV
- Exportar Excel
- Exportar PDF

## Sincronização Google Drive

O app pode sincronizar gratuitamente usando um único arquivo JSON no Google Drive:

```text
financeiro-academico-data.json
```

Formato salvo:

```json
{
  "updatedAt": "2026-05-18T00:00:00.000Z",
  "data": {}
}
```

Características:

- Usa `localStorage` como armazenamento principal offline.
- Usa Google Drive apenas como backup/sincronização pessoal.
- Não usa Firebase, Supabase ou backend próprio.
- Usa `https://www.googleapis.com/auth/drive.file` para o arquivo do app e `profile email` apenas para exibir nome, foto e e-mail.
- Salva alterações no Drive após 5 segundos sem novas mudanças.
- Continua funcionando sem login Google.

### Configurar Google Cloud

1. Acesse o Google Cloud Console.
2. Crie um projeto.
3. Ative a **Google Drive API**.
4. Configure a tela de consentimento OAuth.
5. Crie uma credencial **OAuth Client ID** do tipo **Web application**.
6. Em **Authorized JavaScript origins**, adicione:

```text
https://emanuelletorresleal-mtl.github.io
```

7. Em **Authorized redirect URIs**, adicione:

```text
https://emanuelletorresleal-mtl.github.io/financeiro-academico/
```

8. Copie o Client ID.
9. Cole em `google-drive-config.js`:

```js
clientId: "SEU_CLIENT_ID.apps.googleusercontent.com"
```

10. Faça deploy no GitHub Pages.

### Usar no Notebook e Celular

1. Abra o app no notebook.
2. Entre com Google na seção **Backup**.
3. Clique em **Sincronizar agora** ou apenas altere dados e aguarde o envio automático.
4. Abra o app no celular.
5. Entre com a mesma conta Google.
6. Restaure o backup do Drive quando solicitado.

Se estiver offline, o app continua salvando localmente. Quando a internet voltar, use **Sincronizar agora** ou aguarde a próxima alteração.

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

- Dashboard com indicadores financeiros, gráfico por categoria, forma de pagamento, cartões, receita vs gastos e projeção de saldo.
- Aba única **Gastos** para despesas simples, fixas, vencimentos, parcelas, cartão de crédito, Pix, débito, dinheiro e RU.
- Migração automática de dados antigos de `debts`, `installments` e `variableExpenses` para `expenses`.
- Receitas, gastos, compras parceladas e metas.
- Categorias, subcategorias, formas de pagamento, bancos, cartões e contas editáveis.
- Controle de créditos do RU com recargas, consumo e saldo.
- Cronograma de vencimentos e parcelas.
- Relatórios inteligentes.
- Backup JSON para migração manual.
- Funcionamento offline como PWA.

