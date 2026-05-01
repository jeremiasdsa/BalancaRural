# Balança Rural

PWA mobile-first para controle de pesagem bovina em campo, com dados locais em IndexedDB e suporte offline.

## Rodar localmente

```bash
npm run dev
```

Acesse:

```text
http://127.0.0.1:5173
```

## Verificar sintaxe

```bash
npm run check
```

## Firebase

A sincronização com Cloud Firestore é opcional e fica desativada por padrão. Para ativar, preencha `src/firebase/config.js` com o `firebaseConfig` do seu projeto e altere `firebaseSyncEnabled` para `true`.

Mais detalhes em [FIREBASE.md](./FIREBASE.md).

Hosting configurado para:

```text
https://balancarural.web.app
```

## Implementado nesta primeira versão

- Layout mobile com top bar fixa, bottom navigation e FAB central.
- Cadastro, edição, exclusão e seleção de propriedades.
- Cadastro, edição, exclusão e limpeza de pesagens por propriedade.
- Bottom sheet para adicionar/editar pesagens.
- Relatório detalhado com filtros, resumo, CSV e impressão/PDF.
- Relatório resumido agregado por animal, com CSV e impressão/PDF.
- Manifesto PWA, ícone e service worker com cache básico.
- Sincronização opcional com Cloud Firestore.
