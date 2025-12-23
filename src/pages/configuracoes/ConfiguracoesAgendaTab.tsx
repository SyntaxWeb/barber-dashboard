import type { Dispatch, SetStateAction } from "react";
import { Calendar, Clock, Plus, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { weekDays, type WeekDayKey, type WeeklyScheduleState } from "@/pages/configuracoes/constants";

type ConfiguracoesAgendaTabProps = {
  horarioInicio: string;
  setHorarioInicio: Dispatch<SetStateAction<string>>;
  horarioFim: string;
  setHorarioFim: Dispatch<SetStateAction<string>>;
  intervalo: string;
  setIntervalo: Dispatch<SetStateAction<string>>;
  diasBloqueados: Date[];
  setDiasBloqueados: Dispatch<SetStateAction<Date[]>>;
  weeklySchedule: WeeklyScheduleState;
  selectedDay: WeekDayKey;
  setSelectedDay: Dispatch<SetStateAction<WeekDayKey>>;
  onToggleDay: (day: WeekDayKey, enabled: boolean) => void;
  onWeeklyTimeChange: (day: WeekDayKey, field: "start" | "end", value: string) => void;
  onToggleLunch: (day: WeekDayKey, enabled: boolean) => void;
  onLunchTimeChange: (day: WeekDayKey, field: "lunchStart" | "lunchEnd", value: string) => void;
  onApplyDefaultToDay: (day: WeekDayKey) => void;
  onSaveHorarios: () => void;
  saving: boolean;
};

export function ConfiguracoesAgendaTab({
  horarioInicio,
  setHorarioInicio,
  horarioFim,
  setHorarioFim,
  intervalo,
  setIntervalo,
  diasBloqueados,
  setDiasBloqueados,
  weeklySchedule,
  selectedDay,
  setSelectedDay,
  onToggleDay,
  onWeeklyTimeChange,
  onToggleLunch,
  onLunchTimeChange,
  onApplyDefaultToDay,
  onSaveHorarios,
  saving,
}: ConfiguracoesAgendaTabProps) {
  const horarios = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

  return (
    <TabsContent value="agenda" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários de Trabalho
          </CardTitle>
          <CardDescription>Defina o horário de funcionamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Select value={horarioInicio} onValueChange={setHorarioInicio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {horarios.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Select value={horarioFim} onValueChange={setHorarioFim}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {horarios.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Intervalo entre agendamentos</Label>
            <Select value={intervalo} onValueChange={setIntervalo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-lg border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Horários por dia</p>
              <p className="text-xs text-muted-foreground">
                Escolha um dia, ajuste horários específicos ou aplique o padrão geral.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
              <div className="space-y-1.5">
                <Label>Dia da semana</Label>
                <Select value={selectedDay} onValueChange={(value) => setSelectedDay(value as WeekDayKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.key} value={day.key}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" className="w-full" onClick={() => onApplyDefaultToDay(selectedDay)}>
                  Usar horário padrão
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              {(() => {
                const schedule = weeklySchedule[selectedDay];
                const dayLabel = weekDays.find((day) => day.key === selectedDay)?.label ?? "Dia selecionado";
                return (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{dayLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.enabled ? `${schedule.start} às ${schedule.end}` : "Dia desativado"}
                        </p>
                      </div>
                      <Switch checked={schedule.enabled} onCheckedChange={(checked) => onToggleDay(selectedDay, checked)} />
                    </div>

                    {schedule.enabled && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">Início</Label>
                          <Select value={schedule.start} onValueChange={(value) => onWeeklyTimeChange(selectedDay, "start", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {horarios.map((h) => (
                                <SelectItem key={`start-${h}`} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">Fim</Label>
                          <Select value={schedule.end} onValueChange={(value) => onWeeklyTimeChange(selectedDay, "end", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {horarios.map((h) => (
                                <SelectItem key={`end-${h}`} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border border-muted/50 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Intervalo de almoço</p>
                          <p className="text-xs text-muted-foreground">
                            {schedule.lunchEnabled && schedule.lunchStart && schedule.lunchEnd
                              ? `${schedule.lunchStart} às ${schedule.lunchEnd}`
                              : "Sem intervalo configurado"}
                          </p>
                        </div>
                        <Switch
                          checked={schedule.lunchEnabled}
                          disabled={!schedule.enabled}
                          onCheckedChange={(checked) => onToggleLunch(selectedDay, checked)}
                        />
                      </div>
                      {schedule.enabled && schedule.lunchEnabled && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground">Início do almoço</Label>
                            <Select
                              value={schedule.lunchStart ?? schedule.start}
                              onValueChange={(value) => onLunchTimeChange(selectedDay, "lunchStart", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {horarios.map((h) => (
                                  <SelectItem key={`lunch-start-${h}`} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-muted-foreground">Fim do almoço</Label>
                            <Select
                              value={schedule.lunchEnd ?? schedule.end}
                              onValueChange={(value) => onLunchTimeChange(selectedDay, "lunchEnd", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {horarios.map((h) => (
                                  <SelectItem key={`lunch-end-${h}`} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <Button onClick={onSaveHorarios} className="w-full" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Horários"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Dias Bloqueados
          </CardTitle>
          <CardDescription>Férias, folgas e feriados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dia Bloqueado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="multiple"
                selected={diasBloqueados}
                onSelect={(dates) => setDiasBloqueados(dates || [])}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <div className="flex flex-wrap gap-2">
            {diasBloqueados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dia bloqueado</p>
            ) : (
              diasBloqueados.map((dia, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDiasBloqueados(diasBloqueados.filter((_, i) => i !== index))}
                >
                  {format(dia, "dd/MM/yyyy")}
                  <Trash2 className="h-3 w-3 ml-1" />
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
