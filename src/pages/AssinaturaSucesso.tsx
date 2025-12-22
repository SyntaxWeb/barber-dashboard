import { CheckCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MercadoPagoReturnDetails } from "@/components/subscription/MercadoPagoReturnDetails";
import { useMercadoPagoReturnDetails } from "@/hooks/useMercadoPagoReturnDetails";

export default function AssinaturaSucesso() {
  const navigate = useNavigate();
  const { details } = useMercadoPagoReturnDetails();

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <CardTitle>Pagamento confirmado</CardTitle>
            <CardDescription>Seu plano foi ativado com sucesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Recebemos a confirmacao do Mercado Pago. Em ate alguns segundos todos os recursos premium estarao liberados para
              a sua conta.
            </p>
            <MercadoPagoReturnDetails details={details} />
            <div className="space-y-2">
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Ir para o painel
              </Button>
              <Button variant="outline" onClick={() => navigate("/assinatura")} className="w-full">
                Ver detalhes da assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

