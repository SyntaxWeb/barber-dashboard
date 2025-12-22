import { Clock3 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MercadoPagoReturnDetails } from "@/components/subscription/MercadoPagoReturnDetails";
import { useMercadoPagoReturnDetails } from "@/hooks/useMercadoPagoReturnDetails";
import { useNavigate } from "react-router-dom";

export default function AssinaturaPendente() {
  const navigate = useNavigate();
  const { details } = useMercadoPagoReturnDetails();

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <Clock3 className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle>Pagamento pendente</CardTitle>
            <CardDescription>Ainda estamos aguardando a confirmacao do Mercado Pago.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Assim que o pagamento for aprovado atualizaremos automaticamente o status da sua assinatura. Caso prefira gerar
              um novo link basta voltar para a pagina de assinatura.
            </p>
            <MercadoPagoReturnDetails details={details} />
            <div className="space-y-2">
              <Button onClick={() => navigate("/assinatura")} className="w-full">
                Ver assinatura
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                Voltar ao painel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

