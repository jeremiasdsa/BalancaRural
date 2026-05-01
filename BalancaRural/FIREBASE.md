# Integração Firebase

O app continua usando IndexedDB como fonte local/offline. O Firebase entra como camada de sincronização com Cloud Firestore.

## Configurar

1. Crie ou abra um projeto no Firebase Console.
2. Adicione um app Web.
3. Copie o objeto `firebaseConfig`.
4. Edite `src/firebase/config.js`.
5. Preencha os campos e altere:

```js
export const firebaseSyncEnabled = true;
```

Depois recarregue o app. O indicador abaixo da top bar deve mudar para `Firebase conectado.`

## Estrutura no Firestore

O app usa três coleções:

```text
properties/{propertyId}
weightRecords/{weightRecordId}
appState/activePropertyId
```

## Firebase CLI

Arquivos locais inicializados:

```text
firebase.json
firestore.rules
firestore.indexes.json
```

O Hosting aponta para a pasta `BalancaRural`, onde está o `index.html`.

O site configurado é:

```text
balancarural
```

URL de produção:

```text
https://balancarural.web.app
```

Para associar o projeto quando o login estiver válido:

```bash
firebase use --add
```

Ou informe o projeto diretamente nos comandos:

```bash
firebase deploy --project SEU_PROJECT_ID
```

Para publicar apenas o Hosting:

```bash
firebase deploy --only hosting:balancarural
```

## Regras temporárias para desenvolvimento

Use regras seguras antes de produção. Para teste local controlado, você pode liberar leitura/escrita temporariamente no Firestore, sabendo que isso não deve ir para produção:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Observação

A chave `apiKey` do Firebase Web identifica o projeto, mas as regras do Firestore são o que protegem os dados. Antes de uso real, adicione autenticação e regras por usuário/propriedade.
