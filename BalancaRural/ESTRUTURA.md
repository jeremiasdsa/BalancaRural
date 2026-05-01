# Estrutura do Projeto

Estrutura preparada para uma PWA mobile-first de controle de peso bovino, seguindo o PRD e organizada para telas inspiradas no App bovino.

```text
BalancaRural/
  public/
    icons/
  src/
    app/
    assets/
      icons/
      images/
    components/
      actions/
      cards/
      forms/
      layout/
      modals/
      navigation/
      reports/
    data/
      db/
      repositories/
    features/
      properties/
      weight-records/
    hooks/
    pwa/
    screens/
      dashboard/
      properties/
      reports/
        detailed/
        home/
        summary/
    services/
      export/
    styles/
    types/
    utils/
  tests/
    e2e/
    unit/
```

## Responsabilidades

- `public/`: arquivos estáticos públicos, incluindo ícones do manifesto PWA.
- `src/app/`: bootstrap da aplicação, rotas, providers e configuração global.
- `src/assets/`: imagens e ícones próprios do app.
- `src/components/`: componentes reutilizáveis de UI.
- `src/components/layout/`: top bar fixa, shell mobile e estrutura de página.
- `src/components/navigation/`: bottom navigation, FAB central e controles de navegação.
- `src/components/modals/`: bottom sheets e modais de confirmação.
- `src/components/reports/`: blocos visuais compartilhados entre relatórios.
- `src/data/db/`: configuração do IndexedDB e migrações locais.
- `src/data/repositories/`: acesso a propriedades e registros de pesagem.
- `src/features/`: regras de negócio por domínio.
- `src/hooks/`: hooks reutilizáveis para estado, navegação, offline e formulários.
- `src/pwa/`: service worker, registro PWA e estratégias de cache.
- `src/screens/`: telas principais descritas no PRD.
- `src/services/export/`: exportação CSV/PDF.
- `src/styles/`: tokens visuais, CSS global e estilos mobile-first.
- `src/types/`: modelos TypeScript, como `Property` e `WeightRecord`.
- `src/utils/`: funções utilitárias de data, peso, validação e formatação.
- `tests/`: testes unitários e fluxos e2e.
