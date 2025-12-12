import { MercadoPagoReturnDetail } from "@/hooks/useMercadoPagoReturnDetails";

interface Props {
  details: MercadoPagoReturnDetail[];
  title?: string;
}

export function MercadoPagoReturnDetails({ details, title = "Resumo do retorno" }: Props) {
  if (details.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm">
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <dl className="space-y-1 text-muted-foreground">
        {details.map((detail, index) => (
          <div key={`${detail.key}-${detail.value}-${index}`} className="flex items-center justify-between gap-4">
            <dt>{detail.label}</dt>
            <dd className="font-medium text-foreground">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

