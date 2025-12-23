import type { ConfiguracoesBarbearia, DaySchedule } from "@/data/mockData";

type WeekDay = {
  key: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  label: string;
};

export const weekDays: WeekDay[] = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export type WeekDayKey = (typeof weekDays)[number]["key"];
export type WeeklyScheduleState = Record<WeekDayKey, DaySchedule>;

export const createWeeklyScheduleState = (
  base?: ConfiguracoesBarbearia["weeklySchedule"],
  fallbackStart = "09:00",
  fallbackEnd = "19:00",
): WeeklyScheduleState =>
  weekDays.reduce((acc, day) => {
    const config = base?.[day.key];
    acc[day.key] = {
      enabled: config?.enabled ?? true,
      start: config?.start ?? fallbackStart,
      end: config?.end ?? fallbackEnd,
      lunchEnabled: config?.lunchEnabled ?? false,
      lunchStart: config?.lunchStart ?? null,
      lunchEnd: config?.lunchEnd ?? null,
    };
    return acc;
  }, {} as WeeklyScheduleState);
