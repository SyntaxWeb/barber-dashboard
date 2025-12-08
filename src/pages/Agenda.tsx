import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Layout } from "@/components/layout/Layout";
import { AgendaItem } from "@/components/agenda/AgendaItem";
import { AppointmentModal } from "@/components/agenda/AppointmentModal";
import { Agendamento } from "@/data/mockData";
import { fetchAgendamentosPorData } from "@/services/agendaService";

export default function Agenda() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const dataStr = format(dataSelecionada, "yyyy-MM-dd");

  const loadAgendamentos = async () => {
    setLoading(true);
    try {
      const data = await fetchAgendamentosPorData(dataStr);
      setAgendamentos(data.sort((a, b) => a.horario.localeCompare(b.horario)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendamentos();
  }, [dataStr]);

  const handlePrevDay = () => setDataSelecionada(subDays(dataSelecionada, 1));
  const handleNextDay = () => setDataSelecionada(addDays(dataSelecionada, 1));
  const handleToday = () => setDataSelecionada(new Date());

  const handleOpenModal = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setModalOpen(true);
  };

  const isToday = format(dataSelecionada, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const agendamentosAtivos = agendamentos.filter((a) => a.status !== "cancelado");
  const agendamentosCancelados = agendamentos.filter((a) => a.status === "cancelado");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus agendamentos do dia</p>
          </div>
          <Button asChild className="shadow-gold">
            <Link to="/novo-agendamento">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Link>
          </Button>
        </div>

        {/* Date Navigation */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={(date) => date && setDataSelecionada(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {!isToday && (
                <Button variant="ghost" onClick={handleToday}>
                  Ir para Hoje
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {agendamentosAtivos.length} agendamento{agendamentosAtivos.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </Card>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : agendamentos.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agendamento</h3>
            <p className="text-muted-foreground mb-4">Não há agendamentos para esta data.</p>
            <Button asChild>
              <Link to="/novo-agendamento">
                <Plus className="h-4 w-4 mr-2" />
                Criar Agendamento
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Appointments */}
            {agendamentosAtivos.length > 0 && (
              <div className="space-y-3">
                {agendamentosAtivos.map((agendamento) => (
                  <AgendaItem
                    key={agendamento.id}
                    agendamento={agendamento}
                    onClick={() => handleOpenModal(agendamento)}
                  />
                ))}
              </div>
            )}

            {/* Cancelled Appointments */}
            {agendamentosCancelados.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cancelados</h3>
                {agendamentosCancelados.map((agendamento) => (
                  <AgendaItem
                    key={agendamento.id}
                    agendamento={agendamento}
                    onClick={() => handleOpenModal(agendamento)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AppointmentModal
        agendamento={agendamentoSelecionado}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={loadAgendamentos}
      />
    </Layout>
  );
}
