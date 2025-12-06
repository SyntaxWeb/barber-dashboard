import { Clock, User, Scissors } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agendamento } from '@/data/mockData';
import { formatarPreco } from '@/services/agendaService';
import { cn } from '@/lib/utils';

interface AgendaItemProps {
  agendamento: Agendamento;
  onClick: () => void;
}

export function AgendaItem({ agendamento, onClick }: AgendaItemProps) {
  const statusConfig = {
    confirmado: { 
      label: 'Confirmado', 
      className: 'bg-primary/20 text-primary border-primary/30',
      cardBorder: 'border-l-primary'
    },
    concluido: { 
      label: 'Concluído', 
      className: 'bg-success/20 text-success border-success/30',
      cardBorder: 'border-l-success'
    },
    cancelado: { 
      label: 'Cancelado', 
      className: 'bg-destructive/20 text-destructive border-destructive/30',
      cardBorder: 'border-l-destructive'
    }
  };

  const status = statusConfig[agendamento.status];

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-gold hover:scale-[1.01]",
        "border-l-4",
        status.cardBorder,
        agendamento.status === 'cancelado' && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agendamento.horario}</p>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {formatarPreco(agendamento.preco)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{agendamento.cliente}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Serviço</p>
              <p className="font-medium">{agendamento.servico}</p>
            </div>
          </div>
        </div>

        {agendamento.observacoes && (
          <p className="mt-3 text-sm text-muted-foreground italic border-t border-border pt-3">
            "{agendamento.observacoes}"
          </p>
        )}
      </div>
    </Card>
  );
}
