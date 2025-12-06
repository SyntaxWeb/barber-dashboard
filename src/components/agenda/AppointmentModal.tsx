import { useState } from 'react';
import { X, Phone, Calendar, Clock, Scissors, FileText, Check, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/data/mockData';
import { formatarData, formatarPreco, cancelarAgendamento, concluirAgendamento } from '@/services/agendaService';
import { useToast } from '@/hooks/use-toast';

interface AppointmentModalProps {
  agendamento: Agendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AppointmentModal({ agendamento, open, onOpenChange, onUpdate }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!agendamento) return null;

  const statusConfig = {
    confirmado: { label: 'Confirmado', variant: 'default' as const, className: 'bg-primary text-primary-foreground' },
    concluido: { label: 'Concluído', variant: 'secondary' as const, className: 'bg-success text-success-foreground' },
    cancelado: { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-destructive text-destructive-foreground' }
  };

  const status = statusConfig[agendamento.status];

  const handleConcluir = async () => {
    setLoading(true);
    try {
      await concluirAgendamento(agendamento.id);
      toast({
        title: 'Agendamento concluído',
        description: `Atendimento de ${agendamento.cliente} marcado como concluído.`
      });
      onUpdate();
      onOpenChange(false);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir o agendamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    setLoading(true);
    try {
      await cancelarAgendamento(agendamento.id);
      toast({
        title: 'Agendamento cancelado',
        description: `Agendamento de ${agendamento.cliente} foi cancelado.`
      });
      onUpdate();
      onOpenChange(false);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o agendamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Detalhes do Agendamento</span>
            <Badge className={status.className}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <span className="text-lg font-bold text-primary">
                  {agendamento.cliente.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{agendamento.cliente}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {agendamento.telefone}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{formatarData(agendamento.data)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="font-medium">{agendamento.horario}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Scissors className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Serviço</p>
                <p className="font-medium">{agendamento.servico}</p>
              </div>
              <span className="font-bold text-primary">
                {formatarPreco(agendamento.preco)}
              </span>
            </div>

            {agendamento.observacoes && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{agendamento.observacoes}</p>
                </div>
              </div>
            )}
          </div>

          {agendamento.status === 'confirmado' && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleConcluir}
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelar}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
