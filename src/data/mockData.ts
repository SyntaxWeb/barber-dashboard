export interface AppointmentFeedback {
  service_rating: number;
  professional_rating: number;
  scheduling_rating: number;
  comment?: string | null;
  allow_public_testimonial?: boolean;
  submitted_at?: string | null;
  average_rating?: number | null;
}

export interface Agendamento {
  id: number;
  cliente: string;
  telefone: string;
  data: string;
  horario: string;
  servico: string;
  preco: number;
  status: "confirmado" | "concluido" | "cancelado";
  observacoes?: string;
  feedback?: AppointmentFeedback | null;
}

export interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracao: number; // em minutos
}

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
  lunchEnabled: boolean;
  lunchStart: string | null;
  lunchEnd: string | null;
};

export type WeeklySchedule = Record<string, DaySchedule>;

export interface ConfiguracoesBarbearia {
  horarioInicio: string;
  horarioFim: string;
  intervaloMinutos: number;
  diasBloqueados: string[];
  weeklySchedule?: WeeklySchedule | null;
}

export const agendamentosMock: Agendamento[] = [
  {
    id: 1,
    cliente: "João Silva",
    telefone: "(11) 99999-1234",
    data: "2025-12-06",
    horario: "09:00",
    servico: "Corte Máquina",
    preco: 35,
    status: "concluido",
    observacoes: "Cliente preferencial",
  },
  {
    id: 2,
    cliente: "Marcos Santos",
    telefone: "(11) 98888-5678",
    data: "2025-12-06",
    horario: "10:00",
    servico: "Barba Completa",
    preco: 30,
    status: "confirmado",
  },
  {
    id: 3,
    cliente: "Pedro Oliveira",
    telefone: "(11) 97777-9012",
    data: "2025-12-06",
    horario: "11:00",
    servico: "Combo Corte + Barba",
    preco: 55,
    status: "concluido",
    observacoes: "Primeira vez na barbearia",
  },
  {
    id: 4,
    cliente: "Lucas Mendes",
    telefone: "(11) 96666-3456",
    data: "2025-12-06",
    horario: "14:00",
    servico: "Corte Tesoura",
    preco: 45,
    status: "confirmado",
  },
  {
    id: 5,
    cliente: "Rafael Costa",
    telefone: "(11) 95555-7890",
    data: "2025-12-06",
    horario: "15:00",
    servico: "Corte Degradê",
    preco: 40,
    status: "confirmado",
  },
  {
    id: 6,
    cliente: "Fernando Almeida",
    telefone: "(11) 94444-1234",
    data: "2025-12-07",
    horario: "09:30",
    servico: "Barba Completa",
    preco: 30,
    status: "confirmado",
  },
  {
    id: 7,
    cliente: "Bruno Ferreira",
    telefone: "(11) 93333-5678",
    data: "2025-12-07",
    horario: "11:00",
    servico: "Combo Corte + Barba",
    preco: 55,
    status: "confirmado",
  },
  {
    id: 8,
    cliente: "Carlos Eduardo",
    telefone: "(11) 92222-9012",
    data: "2025-12-07",
    horario: "16:00",
    servico: "Corte Máquina",
    preco: 35,
    status: "cancelado",
    observacoes: "Cancelou por motivo pessoal",
  },
];

export const servicosMock: Servico[] = [
  { id: 1, nome: "Corte Máquina", preco: 35, duracao: 30 },
  { id: 2, nome: "Corte Tesoura", preco: 45, duracao: 45 },
  { id: 3, nome: "Corte Degradê", preco: 40, duracao: 40 },
  { id: 4, nome: "Barba Completa", preco: 30, duracao: 30 },
  { id: 5, nome: "Combo Corte + Barba", preco: 55, duracao: 60 },
  { id: 6, nome: "Sobrancelha", preco: 15, duracao: 15 },
  { id: 7, nome: "Hidratação Capilar", preco: 25, duracao: 20 },
];

export const configuracoesMock: ConfiguracoesBarbearia = {
  horarioInicio: "09:00",
  horarioFim: "19:00",
  intervaloMinutos: 30,
  diasBloqueados: ["2025-12-25", "2025-12-31", "2026-01-01"],
  weeklySchedule: {
    monday: { enabled: true, start: "09:00", end: "19:00", lunchEnabled: true, lunchStart: "12:00", lunchEnd: "13:00" },
    tuesday: { enabled: true, start: "09:00", end: "19:00", lunchEnabled: true, lunchStart: "12:00", lunchEnd: "13:00" },
    wednesday: { enabled: true, start: "09:00", end: "19:00", lunchEnabled: true, lunchStart: "12:00", lunchEnd: "13:00" },
    thursday: { enabled: true, start: "09:00", end: "19:00", lunchEnabled: true, lunchStart: "12:00", lunchEnd: "13:00" },
    friday: { enabled: true, start: "09:00", end: "19:00", lunchEnabled: true, lunchStart: "12:00", lunchEnd: "13:00" },
    saturday: { enabled: true, start: "09:00", end: "18:00", lunchEnabled: false, lunchStart: null, lunchEnd: null },
    sunday: { enabled: false, start: "10:00", end: "15:00", lunchEnabled: false, lunchStart: null, lunchEnd: null },
  },
};

export const barbeiroMock = {
  nome: "Carlos Vintage",
  email: "carlos@barbeariavintage.com",
};
