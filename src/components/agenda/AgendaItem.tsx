import { Clock, User, Scissors, Star, MessageSquareText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agendamento } from "@/data/mockData";
import { formatarPreco } from "@/services/agendaService";
import { cn } from "@/lib/utils";

interface AgendaItemProps {
  agendamento: Agendamento;
  onClick: () => void;
}

export function AgendaItem({ agendamento, onClick }: AgendaItemProps) {
  const statusConfig = {
    confirmado: {
      label: "Confirmado",
      className: "bg-primary/20 text-primary border-primary/30",
      cardBorder: "border-l-primary",
    },
    concluido: {
      label: "Concluído",
      className: "bg-success/20 text-success border-success/30",
      cardBorder: "border-l-success",
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-destructive/20 text-destructive border-destructive/30",
      cardBorder: "border-l-destructive",
    },
  };

  const status = statusConfig[agendamento.status];

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-gold hover:scale-[1.01]",
        "border-l-4",
        status.cardBorder,
        agendamento.status === "cancelado" && "opacity-60",
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
            <p className="text-lg font-bold text-primary">{formatarPreco(agendamento.preco)}</p>
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

        {agendamento.feedback && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-emerald-900">
              <span className="flex items-center gap-1">
                <MessageSquareText className="h-4 w-4" />
                Feedback do cliente
              </span>
              <span className="text-xs font-medium">
                {formatAverage(agendamento.feedback.average_rating, agendamento.feedback)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {renderStars(calculateAverage(agendamento.feedback), "h-4 w-4")}
            </div>
            {agendamento.feedback.comment && (
              <p className="mt-2 text-sm text-emerald-900/90 leading-relaxed">{agendamento.feedback.comment}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

const calculateAverage = (feedback: NonNullable<Agendamento["feedback"]>) => {
  if (typeof feedback.average_rating === "number") {
    return feedback.average_rating;
  }
  const values = [feedback.service_rating, feedback.professional_rating, feedback.scheduling_rating].filter(
    (value) => typeof value === "number" && !Number.isNaN(value),
  );
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

const renderStars = (rating: number, sizeClass = "h-5 w-5") => {
  const safeRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.5;

  return Array.from({ length: 5 }).map((_, index) => {
    const position = index + 1;
    if (position <= fullStars) {
      return <Star key={position} className={`${sizeClass} text-amber-500 fill-amber-500`} />;
    }
    if (hasHalf && position === fullStars + 1) {
      return <Star key={position} className={`${sizeClass} text-amber-500 fill-amber-500/60`} />;
    }
    return <Star key={position} className={`${sizeClass} text-muted-foreground`} />;
  });
};

const formatAverage = (
  average: number | null | undefined,
  feedback: NonNullable<Agendamento["feedback"]>,
): string => {
  const computed = average ?? calculateAverage(feedback);
  if (!computed) return "Sem nota";
  return `${computed.toFixed(1)} / 5`;
};
