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

## Implementado nesta primeira versão

- Layout mobile com top bar fixa, bottom navigation e FAB central.
- Cadastro, edição, exclusão e seleção de propriedades.
- Seed inicial com `Riacho do Boi`.
- Cadastro, edição, exclusão e limpeza de pesagens por propriedade.
- Bottom sheet para adicionar/editar pesagens.
- Relatório detalhado com filtros, resumo, CSV e impressão/PDF.
- Relatório resumido agregado por animal, com CSV e impressão/PDF.
- Manifesto PWA, ícone e service worker com cache básico.
