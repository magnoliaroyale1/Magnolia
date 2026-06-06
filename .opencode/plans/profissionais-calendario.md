# Plano: Profissionais + Calendário + Agendamento reformulado

## Sumário das decisões

| Decisão | Escolha |
|---------|---------|
| Login do profissional | **Login próprio** (role `professional`), mas **criado pela clínica** via painel |
| Calendário | **Lista de agendamentos + seletor de dia** (não grade semanal) |
| Fluxo de booking | **Procedimento → Profissional → Horário** |
| Portfólio do profissional | **Sim** — fotos antes/depois vinculadas ao profissional |
| Grade de horários | **Configurável pela clínica** (dias, horas, duração do slot) |
| Avaliações | **Ambos** — clínica tem nota geral, profissionais têm notas individuais (média compõe nota da clínica) |

## Arquitetura de dados

### Novas coleções no Firestore

```
professionals/{professionalUid}
  uid: string          ← mesmo uid do auth
  clinicId: string     ← vínculo com a clínica
  name: string
  email: string
  photoURL: string
  bio: string
  procedures: string[] ← ex.: ["Botox", "Preenchimento"]
  createdAt: Timestamp

professionals/{professionalUid}/portfolio/{id}
  imageUrl: string
  procedure: string
  description: string
  createdAt: Timestamp

clinics/{clinicId}/schedule/main              ← grade horária da clínica
  daysOfWeek: number[]                         ← [1,2,3,4,5] (seg-sex)
  startTime: string                            ← "08:00"
  endTime: string                              ← "18:00"
  slotDuration: number                         ← 60 (minutos)
  blockedDates: string[]                       ← ["2026-06-15", ...]

reviews/{reviewId}
  ... (existing) +
  professionalId?: string                      ← opcional, se a review for para um profissional
```

### Tipos novos/alterados (`src/types/index.ts`)

```typescript
// NOVO
export interface Professional {
  id: string;
  uid: string;
  clinicId: string;
  name: string;
  email: string;
  photoURL?: string;
  bio: string;
  procedures: string[];
  createdAt: Timestamp;
}

// NOVO
export interface ProfessionalPortfolio {
  id: string;
  imageUrl: string;
  procedure: string;
  description: string;
  createdAt: Timestamp;
}

// NOVO
export interface ClinicSchedule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  blockedDates: string[];
}

// ALTERADO — Appointment ganha professionalId/professionalName
export interface Appointment {
  id: string;
  clinicId: string;
  professionalId: string;     // NOVO
  professionalName: string;   // NOVO
  clientId: string;
  clientName: string;
  procedure: string;
  date: Date | Timestamp;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  valor?: number;
}

// ALTERADO — User ganha role 'professional'
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'client' | 'clinic' | 'admin' | 'professional';
  photoURL?: string;
  createdAt: Timestamp | Date;
  clinicId?: string;
}
```

## Cloud Function necessária

Criar `createProfessionalUser` (callable function via Firebase Admin SDK):

```
Entrada: { email, password, name, clinicId }
Saída:   { uid: string }
```

Necessária porque criar Auth user pelo client-side derrubaria o login do admin da clínica.

---

## Fases de implementação

### 🔷 FASE 1 — Fundação (types, auth, hooks base)

| # | Arquivo | O quê |
|---|---------|-------|
| 1 | `src/types/index.ts` | Adicionar `Professional`, `ProfessionalPortfolio`, `ClinicSchedule`. Alterar `User.role` e `Appointment`. |
| 2 | `src/context/AuthContext.tsx` | Adicionar `isProfessional`, tratar role `'professional'` |
| 3 | `src/components/ProtectedRoute.tsx` | Permitir `'professional'` nos guards |
| 4 | `src/hooks/useProfessionals.ts` | Hook: `useProfessionalsByClinic(clinicId)`, `useProfessional(uid)`, `useCreateProfessional`, `useUpdateProfessional`, `useDeleteProfessional` |
| 5 | `src/hooks/useClinicSchedule.ts` | Hook: `useClinicSchedule(clinicId)`, `useUpdateSchedule` |
| 6 | `src/hooks/useProfessionalAvailability.ts` | Hook que calcula slots disponíveis para um profissional em uma data, baseado na `ClinicSchedule` e nos `Appointment` existentes |

### 🔷 FASE 2 — Gestão de Profissionais (painel da clínica)

| # | Arquivo | O quê |
|---|---------|-------|
| 7 | `src/pages/DashboardClinic.tsx` | Adicionar seção "Gerenciar Profissionais" com:
|   |         | - Botão "Adicionar Profissional"
|   |         | - Modal de criação: nome, email, senha, bio, foto, procedimentos
|   |         | - Lista de profissionais com editar/excluir
|   |         | - Chama Cloud Function `createProfessionalUser` e cria docs |
| 8 | `src/pages/DashboardClinic.tsx` | Adicionar seção "Configurar Horários" com:
|   |         | - Dias da semana (checkboxes)
|   |         | - Hora início/fim (time picker)
|   |         | - Duração do slot (30min/60min)
|   |         | - Dias bloqueados (date picker para feriados/férias) |

### 🔷 FASE 3 — Painel do Profissional

| # | Arquivo | O quê |
|---|---------|-------|
| 9 | `src/pages/DashboardProfessional.tsx` | Página com:
|   |         | - Header com nome/foto/bio editável
|   |         | - Lista de agendamentos (só os seus, filtrados por `professionalId`)
|   |         | - Seção "Meu Portfólio" (upload de fotos antes/depois)
|   |         | - Estatísticas: total de atendimentos, média de avaliações |
| 10 | `src/components/Navbar.tsx` | Adicionar link "Meu Painel" para role `professional` |
| 11 | `src/routes/index.tsx` | Adicionar rota `/dashboard/professional` |
| 12 | `src/hooks/useAppointments.ts` | Adicionar `useAppointmentsByProfessional(professionalId)` |

### 🔷 FASE 4 — Novo Fluxo de Agendamento (ClinicPage)

| # | Arquivo | O quê |
|---|---------|-------|
| 13 | `src/pages/ClinicPage.tsx` | Reformular o formulário de agendamento:
|   |         | - Passo 1: Selecionar **Procedimento** (igual hoje)
|   |         | - Passo 2: Mostrar cards dos **profissionais** que fazem aquele procedimento (foto, nome, bio resumida, avaliação)
|   |         | - Passo 3: **Calendário/TimeSlotPicker** com horários disponíveis daquele profissional |
| 14 | `src/components/ProfessionalCard.tsx` | Card para exibir profissional na ClinicPage |
| 15 | `src/components/TimeSlotPicker.tsx` | Componente que mostra grade de horários disponíveis para uma data + profissional (usa `useProfessionalAvailability`) |
| 16 | `src/hooks/useCreateAppointment.ts` | Atualizar para incluir `professionalId` e `professionalName` |

### 🔷 FASE 5 — Calendário/Lista no DashboardClinic

| # | Arquivo | O quê |
|---|---------|-------|
| 17 | `src/components/DaySchedule.tsx` | Componente: seletor de data (input date + setas < >), abaixo lista de appointments daquele dia, com:
|   |         | - Filtro por profissional (dropdown ou pills)
|   |         | - Cada appointment: horário, cliente, procedimento, profissional, status (badge colorido)
|   |         | - Ações: confirmar/cancelar |
| 18 | `src/pages/DashboardClinic.tsx` | Substituir lista de appointments atual pelo `DaySchedule` |

### 🔷 FASE 6 — Avaliações por profissional

| # | Arquivo | O quê |
|---|---------|-------|
| 19 | `src/hooks/useProfessionalReviews.ts` | Hook: buscar reviews filtradas por `professionalId` |
| 20 | `src/hooks/useSubmitProfessionalReview.ts` | Hook: criar review com `professionalId` opcional |
| 21 | `src/pages/ClinicPage.tsx` | Aba "Avaliações": mostrar avaliações da clínica (sem profissional) + de cada profissional (agrupadas) |
| 22 | `src/pages/ClinicPage.tsx` | Modal de avaliação: permitir selecionar "Avaliar clínica" ou "Avaliar profissional X" |
| 23 | `src/utils/score.ts` | Atualizar score da clínica para considerar média das avaliações dos profissionais |

### 🔷 FASE 7 — Portfólio

| # | Arquivo | O quê |
|---|---------|-------|
| 24 | `src/pages/DashboardProfessional.tsx` | Seção "Meu Portfólio": upload de fotos, selecionar procedimento relacionado, descrição |
| 25 | `src/hooks/useProfessionalPortfolio.ts` | Hook: CRUD de fotos do portfólio |
| 26 | `src/pages/ClinicPage.tsx` | Aba "Profissionais": cada profissional com seu portfólio de fotos (antes/depois) |

### 🔷 FASE 8 — DashboardClient

| # | Arquivo | O quê |
|---|---------|-------|
| 27 | `src/pages/DashboardClient.tsx` | Mostrar nome do profissional nos appointments do cliente |

---

## Observações técnicas importantes

1. **Cloud Function necessária para FASE 2**: Criar usuário Auth sem deslogar o admin. Sem a function, não é possível criar o profissional. A implementação do frontend pode mockar por enquanto (criar só o doc `professionals` + `users` sem Auth), mas o fluxo real exige a function.

2. **Compatibilidade reversa**: Appointments existentes (sem `professionalId`) serão exibidos normalmente. Podemos definir um profissional padrão "Não atribuído" ou simplesmente mostrar "—" quando não houver profissional vinculado.

3. **Índices Firestore**: As queries com `where('professionalId', '==', X) + orderBy('date')` precisarão de índice composto. Incluir fallback client-side quando necessário.

4. **Regra de conflito**: Ao criar appointment, verificar se já existe appointment `confirmed` ou `pending` para o mesmo profissional na mesma data/horário. Impedir duplicata no frontend (TimeSlotPicker já filtra) e validar no backend (regra Firestore ou Cloud Function).

## Perguntas para alinhamento antes de implementar

1. Cloud Function: prefere que eu implemente primeiro um **mock** (cria só os documentos, sem Auth real) para testar o fluxo completo, ou já implementar direto com a Cloud Function?
2. Ordem das fases: prefere seguir a ordem linear (1→8) ou pular para alguma fase específica primeiro (ex.: FASE 3 do profissional antes da FASE 2 de gestão)?
3. Duração dos slots: 30min ou 60min como padrão?

---

## Impacto nos arquivos existentes

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/types/index.ts` | Adicionar 3 interfaces, alterar 2 |
| `src/context/AuthContext.tsx` | Adicionar isProfessional |
| `src/components/ProtectedRoute.tsx` | Adicionar 'professional' |
| `src/pages/DashboardClinic.tsx` | **Grande** — adicionar gestão de profissionais + horários + calendário |
| `src/pages/ClinicPage.tsx` | **Grande** — novo fluxo de booking, exibir profissionais |
| `src/pages/DashboardClient.tsx` | Pequena — exibir nome do profissional |
| `src/components/Navbar.tsx` | Adicionar link |
| `src/routes/index.tsx` | Adicionar rota |
| `src/utils/score.ts` | Atualizar cálculo |
| `src/hooks/useAppointments.ts` | Adicionar hook por profissional |
| Cloud Functions (novo) | `createProfessionalUser` |

## Novos arquivos (11)

| Caminho | Finalidade |
|---------|------------|
| `src/hooks/useProfessionals.ts` | CRUD profissionais |
| `src/hooks/useClinicSchedule.ts` | CRUD grade horária |
| `src/hooks/useProfessionalAvailability.ts` | Calcular slots disponíveis |
| `src/hooks/useProfessionalReviews.ts` | Buscar reviews por profissional |
| `src/hooks/useSubmitProfessionalReview.ts` | Criar review com profissionalId |
| `src/hooks/useProfessionalPortfolio.ts` | CRUD fotos do portfólio |
| `src/components/ProfessionalCard.tsx` | Card do profissional |
| `src/components/TimeSlotPicker.tsx` | Seletor de horário disponível |
| `src/components/DaySchedule.tsx` | Calendário/lista do dia |
| `src/pages/DashboardProfessional.tsx` | Painel do profissional |
| Cloud Function | `createProfessionalUser` |
