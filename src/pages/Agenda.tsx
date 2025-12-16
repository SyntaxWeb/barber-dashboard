import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FullCalendar, { DateClickArg, DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/react";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/core/index.js";
import "@fullcalendar/daygrid/index.js";
import "@fullcalendar/timegrid/index.js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { AppointmentModal } from "@/components/agenda/AppointmentModal";
import { AgendaItem } from "@/components/agenda/AgendaItem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Agendamento } from "@/data/mockData";
import { fetchAgendamentosPorPeriodo } from "@/services/agendaService";

type DateRange = { start: string; end: string };

export default function Agenda() {
  const [range, setRange] = useState<DateRange | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const cacheRef = useRef<Record<string, Agendamento[]>>({});
  const fetchingRanges = useRef<Set<string>>(new Set());

  const loadAgendamentos = useCallback(async () => {
    if (!range) return;
    const cacheKey = `${range.start}_${range.end}`;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setAgendamentos(cached);
      setLoadError(null);
      return;
    }
    if (fetchingRanges.current.has(cacheKey)) {
      return;
    }
    fetchingRanges.current.add(cacheKey);
    setLoading(true);
    try {
      setLoadError(null);
      const data = await fetchAgendamentosPorPeriodo(range.start, range.end);
      const sorted = [...data].sort((a, b) => {
        const dateCompare = (a.data ?? "").localeCompare(b.data ?? "");
        if (dateCompare !== 0) return dateCompare;
        return a.horario.localeCompare(b.horario);
      });
      cacheRef.current[cacheKey] = sorted;
      setAgendamentos(sorted);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os agendamentos.");
      setAgendamentos([]);
    } finally {
      fetchingRanges.current.delete(cacheKey);
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAgendamentos();
  }, [loadAgendamentos]);

  const refreshCurrentRange = useCallback(async () => {
    if (range) {
      const cacheKey = `${range.start}_${range.end}`;
      delete cacheRef.current[cacheKey];
    }
    await loadAgendamentos();
  }, [loadAgendamentos, range]);

  const events = useMemo<EventInput[]>(() => {
    return agendamentos.map((agendamento) => {
      const start = `${agendamento.data}T${agendamento.horario}`;
      let color = "#2563eb";
      if (agendamento.status === "concluido") {
        color = "#059669";
      } else if (agendamento.status === "cancelado") {
        color = "#dc2626";
      }
      return {
        id: String(agendamento.id),
        title: `${agendamento.horario} - ${agendamento.cliente}`,
        start,
        backgroundColor: color,
        borderColor: color,
        textColor: "#ffffff",
        extendedProps: {
          agendamentoId: agendamento.id,
        },
      };
    });
  }, [agendamentos]);

  const agendamentosPorDia = useMemo(() => {
    return agendamentos.reduce<Record<string, Agendamento[]>>((acc, agendamento) => {
      const key = agendamento.data ?? "";
      if (!acc[key]) acc[key] = [];
      acc[key].push(agendamento);
      return acc;
    }, {});
  }, [agendamentos]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const start = format(arg.start, "yyyy-MM-dd");
    const end = format(arg.end, "yyyy-MM-dd");
    setRange((prev) => {
      if (prev?.start === start && prev?.end === end) {
        return prev;
      }
      return { start, end };
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const agendamento = agendamentos.find((item) => String(item.id) === arg.event.id);
    if (agendamento) {
      setAgendamentoSelecionado(agendamento);
      setModalOpen(true);
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    setDayModalDate(arg.date);
    setDayModalOpen(true);
  };

  const dayAppointments = useMemo(() => {
    if (!dayModalDate) return [];
    const key = format(dayModalDate, "yyyy-MM-dd");
    const items = agendamentosPorDia[key] ?? [];
    return [...items].sort((a, b) => a.horario.localeCompare(b.horario));
  }, [agendamentosPorDia, dayModalDate]);

  const dayModalTitle = dayModalDate ? format(dayModalDate, "dd 'de' MMMM", { locale: ptBR }) : "";

  const closeDayModal = (open: boolean) => {
    setDayModalOpen(open);
    if (!open) {
      setDayModalDate(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Visualização completa com FullCalendar</p>
          </div>
          <Button asChild className="shadow-gold">
            <Link to="/novo-agendamento">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Link>
          </Button>
        </div>

        <Card className="p-2 sm:p-4">
          {loading && (
            <div className="mb-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
              Carregando agendamentos do período...
            </div>
          )}
          {loadError && (
            <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {loadError}
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locales={[ptBrLocale]}
            locale="pt-br"
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
            }}
            height="auto"
            events={events}
            selectable
            selectMirror
            dayMaxEventRows
            expandRows
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
          />
        </Card>
      </div>

      <AppointmentModal
        agendamento={agendamentoSelecionado}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={refreshCurrentRange}
      />

      <Dialog open={dayModalOpen} onOpenChange={closeDayModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agenda de {dayModalTitle || "dia selecionado"}</DialogTitle>
            <DialogDescription>
              {dayAppointments.length === 0
                ? "Não há horários confirmados nessa data."
                : `${dayAppointments.length} agendamento${dayAppointments.length !== 1 ? "s" : ""} encontrados.`}
            </DialogDescription>
          </DialogHeader>
          {dayAppointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum agendamento registrado nesse dia.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {dayAppointments.map((agendamento) => (
                <AgendaItem
                  key={agendamento.id}
                  agendamento={agendamento}
                  onClick={() => {
                    closeDayModal(false);
                    setAgendamentoSelecionado(agendamento);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
