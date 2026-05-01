Create a mobile-first Progressive Web App (PWA) for cattle weight management on farms.

The app must be designed for field use: fast, simple, offline-first, touch-friendly, and optimized for farmers recording cattle weight during daily operations.

Build the UI inspired by a clean iOS-style mobile app with:
- Light gray background
- Black fixed top app bar
- Large readable typography
- Rounded cards
- High-contrast action buttons
- Bottom navigation
- Central floating action button for quick weight input

Language: Brazilian Portuguese.

### Main Layout

Use a fixed black top bar with:
- Square logo on the left
- Active property name, e.g. “Riacho do Boi”
- Dropdown arrow to switch property
- Three-dot menu on the right

Use a fixed bottom navigation with:
- “Propriedades”
- “Relatórios”

Add a central green floating action button above the bottom navigation with a scanner/target icon for quick animal/weight input.

### Core Features

#### 1. Property Management

Create a “Propriedades” screen where users can:
- Create a new property
- Edit existing properties
- Delete properties
- Select the active property

Each property should appear in a large rounded card showing:
- Property number/id, e.g. “#1”
- Property name, e.g. “Riacho do Boi”
- Edit button in blue/purple with pencil icon
- Delete button in red with trash icon

Add a green “Novo +” button at the top right.

#### 2. Weight Dashboard

Create the main weight tracking screen for the active property.

At the top, show the current/total weight indicator in large bold text, e.g. “0 kg”.

Below it, show two large horizontal buttons:
- Red “Limpar histórico” with trash icon
- Green “Adicionar +”

Display weight records as rounded cards sorted by most recent.

Each card must show:
- Animal ID in bold
- Date and time
- Weight in green, e.g. “320 kg”
- Red delete button with trash icon
- Yellow edit button with pencil icon

The screen must support:
- Add new weight record
- Edit weight record
- Delete weight record
- Clear history for the active property

#### 3. Add/Edit Weight Modal

When the user taps “Adicionar” or the floating action button, open a bottom sheet modal.

The modal must:
- Dim the background
- Slide from the bottom
- Have a white panel with rounded top corners
- Include a field labeled “Peso”
- Include a field labeled “Código do Animal”
- Use placeholder “Digite o código do animal”
- Include a large green “Confirmar” button with check icon

Fields:
- Animal ID: text or numeric
- Weight: number in kilograms
- Timestamp: generated automatically

Validate required fields before saving.

#### 4. Reports Home

Create a “Relatórios” screen with two large navigation buttons:
- “Detalhado” in blue
- “Resumido” in green

Each button should be full-width, rounded, and have a right arrow icon.

#### 5. Detailed Report

Create a “Relatório Detalhado” screen with:
- Expandable filters section with filter icon
- Filters for date range and animal ID
- Red “Excluir tudo” button
- List of all filtered records
- Edit and delete actions for each record
- Summary area at the bottom
- Export buttons for CSV and PDF

Each record card should show:
- Animal ID
- Date/time
- Weight in green
- Delete button in red
- Edit button in yellow

Summary statistics:
- Quantidade
- Maior peso
- Menor peso
- Média
- Total

Export buttons:
- Green CSV button
- Red PDF button

#### 6. Summary Report

Create a “Relatório Resumido” screen with:
- Dropdown selector with default option “Todos”
- Expandable filters section
- Aggregated record list
- Summary statistics
- CSV and PDF export buttons

The summary report should aggregate records by animal or selected period.

### Data Model

Property:
- id
- name
- createdAt

WeightRecord:
- id
- propertyId
- animalId
- weight
- timestamp
- updatedAt

### Offline/PWA Requirements

The app must be a PWA:
- Installable on mobile
- Offline-first
- Store data locally using IndexedDB
- Work without internet connection
- Preserve records after reload
- Use service worker caching
- Provide fast interactions for field usage

Cloud sync can be optional and prepared as a future enhancement.

### Visual Style

Use the following color semantics:
- Green: add, confirm, primary action, positive values
- Red: delete, clear, destructive actions
- Yellow: edit actions
- Blue: reports/navigation emphasis
- Black: top navigation bar
- Light gray: app background
- White/light gray: cards and inputs

UI requirements:
- Mobile-first layout
- Large tap targets
- Rounded corners around 8–12px
- Minimal visual noise
- No marketing landing page
- The first screen should be the actual app
- Use icons for actions: plus, trash, pencil, filter, file, scanner, menu
- Keep the interface in Brazilian Portuguese

### Goal

Create a simple, fast, reliable cattle weight management PWA for farmers to register, edit, delete, review, filter, and export cattle weight records by property during field operations.
