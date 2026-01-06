export type AvailabilityData = {
  horarios: string[];
  horas: string[];
  minutosPorHora: Record<string, string[]>;
};

type AvailabilityApiResponse = {
  horarios?: string[];
  horas?: string[];
  minutos_por_hora?: Record<string, string[]>;
};

const pad2 = (value: string | number) => String(value).padStart(2, "0");

const compareTime = (a: string, b: string) => a.localeCompare(b);

const normalizeSlots = (slots: Array<string | number>) =>
  slots
    .map((slot) => String(slot).trim())
    .filter(Boolean)
    .map((slot) => {
      const [hour, minute] = slot.split(":");
      if (!hour || minute === undefined) return "";
      return `${pad2(hour)}:${pad2(minute)}`;
    })
    .filter(Boolean)
    .sort(compareTime);

export const buildAvailabilityFromSlots = (slots: string[]): AvailabilityData => {
  const horarios = normalizeSlots(slots);
  const minutesByHour: Record<string, Set<string>> = {};

  for (const horario of horarios) {
    const [hour, minute] = horario.split(":");
    if (!minutesByHour[hour]) {
      minutesByHour[hour] = new Set();
    }
    minutesByHour[hour].add(minute);
  }

  const horas = Object.keys(minutesByHour).sort();
  const minutosPorHora: Record<string, string[]> = {};
  for (const hora of horas) {
    minutosPorHora[hora] = Array.from(minutesByHour[hora]).sort();
  }

  return { horarios, horas, minutosPorHora };
};

export const normalizeAvailabilityResponse = (payload: AvailabilityApiResponse): AvailabilityData => {
  const horarios = Array.isArray(payload.horarios) ? payload.horarios : [];
  const minutosRaw = payload.minutos_por_hora ?? null;
  const horasRaw = Array.isArray(payload.horas) ? payload.horas : [];

  if (!minutosRaw || Object.keys(minutosRaw).length === 0) {
    return buildAvailabilityFromSlots(horarios);
  }

  const minutosPorHora: Record<string, string[]> = {};
  for (const [hora, minutos] of Object.entries(minutosRaw)) {
    if (!Array.isArray(minutos)) continue;
    const normalizedHora = pad2(hora);
    const normalizedMinutes = minutos.map(pad2).sort();
    if (normalizedMinutes.length > 0) {
      minutosPorHora[normalizedHora] = normalizedMinutes;
    }
  }

  const horas = (horasRaw.length > 0 ? horasRaw : Object.keys(minutosPorHora))
    .map(pad2)
    .filter((hora) => minutosPorHora[hora]?.length)
    .sort();

  const horariosFromMap = horas.flatMap((hora) => minutosPorHora[hora].map((minuto) => `${hora}:${minuto}`));

  return {
    horarios: normalizeSlots(horarios.length ? horarios : horariosFromMap),
    horas,
    minutosPorHora,
  };
};

export const joinHorario = (hora: string, minuto: string) =>
  hora && minuto ? `${pad2(hora)}:${pad2(minuto)}` : "";

export const splitHorario = (horario: string): { hora: string; minuto: string } => {
  const [hora, minuto] = horario.split(":");
  return {
    hora: hora ? pad2(hora) : "",
    minuto: minuto ? pad2(minuto) : "",
  };
};
