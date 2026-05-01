# Plano de Implementação

Este plano segue o PRD como uma PWA local-first para uso em campo. A implementação deve ser guiada por fluxos de produto completos: tela, estado, persistência, validação, offline e experiência mobile caminhando juntos.

## Objetivo

Criar uma PWA mobile-first para controle de pesagem bovina, em português brasileiro, rápida, simples, instalável, offline-first e persistente via IndexedDB.

O primeiro carregamento do app deve abrir diretamente a experiência operacional, sem landing page.

## Premissas

- Aplicação mobile-first.
- Interface inspirada em app iOS limpo.
- Dados armazenados localmente com IndexedDB.
- Funcionamento offline após o primeiro acesso.
- Navegação principal com top bar fixa, bottom navigation e FAB central.
- A propriedade ativa define o contexto dos registros.
- Exportações CSV/PDF usam os dados locais filtrados.

## Modelos de Dados

```ts
type Property = {
  id: string;
  name: string;
  createdAt: string;
};

type WeightRecord = {
  id: string;
  propertyId: string;
  animalId: string;
  weight: number;
  timestamp: string;
  updatedAt: string;
};

type AppState = {
  activePropertyId: string | null;
};
```

## Etapa 1: Fundação do App

Criar a base navegável da aplicação.

### Entregas

- Configuração inicial da aplicação.
- Estrutura de rotas/telas.
- Layout principal mobile-first.
- Top bar preta fixa com:
  - logo quadrado;
  - nome da propriedade ativa;
  - seta de troca de propriedade;
  - menu de três pontos.
- Bottom navigation com:
  - `Propriedades`;
  - `Relatórios`.
- FAB central verde para entrada rápida de pesagem.
- Estilos globais e tokens visuais.

### Critérios de Aceite

- A aplicação abre em uma tela funcional.
- Top bar e bottom navigation permanecem fixos.
- FAB não sobrepõe conteúdo importante.
- Layout funciona bem em largura mobile.

## Etapa 2: Persistência Local

Implementar a base local de dados.

### Entregas

- Configuração do IndexedDB.
- Stores para propriedades e pesagens.
- Repositórios locais para CRUD.
- Controle da propriedade ativa.
- Seed inicial opcional com `Riacho do Boi`.

### Critérios de Aceite

- Dados persistem após reload.
- Registros são vinculados à propriedade correta.
- A aplicação funciona sem depender de rede para ler/escrever dados.

## Etapa 3: Fluxo de Propriedades

Implementar a tela de gerenciamento de propriedades.

### Entregas

- Tela `Propriedades`.
- Botão verde `Novo +`.
- Lista de propriedades em cards grandes.
- Cada card deve exibir:
  - número/id da propriedade;
  - nome;
  - botão de editar;
  - botão de excluir;
  - estado visual de propriedade ativa.
- Criação, edição, exclusão e seleção de propriedade.
- Confirmação antes de excluir.

### Critérios de Aceite

- Usuário consegue criar uma propriedade.
- Usuário consegue selecionar a propriedade ativa.
- Usuário consegue editar e excluir propriedades.
- Ao excluir a ativa, outra propriedade é selecionada ou o app fica em estado claro para criação de nova.

## Etapa 4: Dashboard de Pesagens

Implementar a tela principal de pesagens da propriedade ativa.

### Entregas

- Indicador grande de peso, exemplo `0 kg`.
- Botão vermelho `Limpar histórico`.
- Botão verde `Adicionar +`.
- Lista de registros ordenada por mais recente.
- Cards de registros com:
  - código do animal em destaque;
  - data e hora;
  - peso em verde;
  - botão vermelho de excluir;
  - botão amarelo de editar.
- Ações de adicionar, editar, excluir e limpar histórico.

### Critérios de Aceite

- Registros aparecem apenas para a propriedade ativa.
- Novos registros aparecem no topo da lista.
- `Limpar histórico` remove somente registros da propriedade ativa.
- Ações destrutivas pedem confirmação.

## Etapa 5: Bottom Sheet de Pesagem

Criar o fluxo de adicionar/editar pesagem.

### Entregas

- Bottom sheet com fundo escurecido.
- Painel branco com cantos superiores arredondados.
- Campo `Peso`.
- Campo `Código do Animal`.
- Placeholder `Digite o código do animal`.
- Botão verde `Confirmar` com ícone de check.
- Abertura pelo botão `Adicionar +`.
- Abertura pelo FAB central.
- Abertura em modo edição pelos cards.

### Critérios de Aceite

- Campos obrigatórios são validados.
- Peso inválido não é salvo.
- Timestamp é gerado automaticamente na criação.
- `updatedAt` é atualizado na edição.
- Após salvar, modal fecha e lista é atualizada.

## Etapa 6: Home de Relatórios

Criar a entrada para relatórios.

### Entregas

- Tela `Relatórios`.
- Botão azul `Detalhado` com seta à direita.
- Botão verde `Resumido` com seta à direita.
- Navegação para relatório detalhado.
- Navegação para relatório resumido.

### Critérios de Aceite

- Tela é simples, direta e sem conteúdo de marketing.
- Botões têm área de toque confortável.
- Navegação funciona corretamente.

## Etapa 7: Relatório Detalhado

Implementar o relatório item a item.

### Entregas

- Tela `Relatório Detalhado`.
- Seção expansível de filtros com ícone de filtro.
- Filtros por:
  - intervalo de datas;
  - código do animal.
- Lista filtrada de registros.
- Botões de editar e excluir por registro.
- Botão vermelho `Excluir tudo`.
- Área de resumo com:
  - quantidade;
  - maior peso;
  - menor peso;
  - média;
  - total.
- Exportação CSV.
- Exportação PDF.

### Critérios de Aceite

- Filtros afetam lista, resumo e exportações.
- Registros filtrados exibem dados corretos.
- Editar/excluir reflete no dashboard.
- `Excluir tudo` exige confirmação.

## Etapa 8: Relatório Resumido

Implementar visão agregada.

### Entregas

- Tela `Relatório Resumido`.
- Dropdown com opção padrão `Todos`.
- Seção expansível de filtros.
- Lista agregada.
- Resumo estatístico.
- Exportação CSV.
- Exportação PDF.

### Agregação Inicial Recomendada

Agrupar por animal:

- código do animal;
- quantidade de pesagens;
- último peso;
- maior peso;
- menor peso;
- média.

### Critérios de Aceite

- Usuário consegue ver dados consolidados por animal.
- Dropdown altera o conjunto exibido.
- Filtros afetam resumo e exportações.

## Etapa 9: Exportações

Implementar geração de arquivos a partir dos dados locais.

### Entregas

- CSV para relatório detalhado.
- CSV para relatório resumido.
- PDF para relatório detalhado.
- PDF para relatório resumido.

### Critérios de Aceite

- Arquivos usam colunas em português.
- Exportações respeitam filtros ativos.
- PDF inclui nome da propriedade, data de geração, registros/agregados e resumo.

## Etapa 10: PWA e Offline

Finalizar requisitos de instalação e cache.

### Entregas

- `manifest.json`.
- Ícones da PWA.
- Registro de service worker.
- Cache de assets essenciais.
- Fallback offline.

### Critérios de Aceite

- App pode ser instalado em dispositivo móvel.
- App abre offline após primeiro carregamento.
- Dados continuam acessíveis offline.
- Reload não apaga registros.

## Etapa 11: Polimento Mobile

Refinar a experiência para uso em campo.

### Entregas

- Estados vazios claros.
- Feedback visual após salvar, editar e excluir.
- Tipografia grande e legível.
- Botões com alto contraste.
- Áreas de toque confortáveis.
- Ajustes de espaçamento para telas pequenas.
- Revisão de sobreposição entre conteúdo, FAB e bottom navigation.

### Critérios de Aceite

- Interface é utilizável com uma mão.
- Textos não estouram containers.
- Ações principais são fáceis de encontrar.
- App mantém aparência limpa e objetiva.

## MVP Prioritário

Para uma primeira versão utilizável em campo, priorizar:

1. Layout principal com navegação.
2. IndexedDB.
3. Propriedades.
4. Dashboard de pesagens.
5. Bottom sheet de adicionar/editar.
6. Persistência offline.
7. Relatório detalhado básico.
8. Exportação CSV.

Depois do MVP:

1. Exportação PDF.
2. Relatório resumido.
3. Filtros avançados.
4. Melhorias de instalação PWA.
5. Preparação para sincronização em nuvem futura.

## Riscos e Cuidados

- Evitar fluxo longo para registrar uma pesagem.
- Não permitir perda acidental de dados.
- Confirmar sempre ações destrutivas.
- Manter registros isolados por propriedade.
- Garantir que filtros e exportações usem a mesma fonte de dados.
- Testar reload e uso offline cedo, não apenas no final.

