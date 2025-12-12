import { XCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MercadoPagoReturnDetails } from "@/components/subscription/MercadoPagoReturnDetails";
import { useMercadoPagoReturnDetails } from "@/hooks/useMercadoPagoReturnDetails";
import { useNavigate } from "react-router-dom";

export default function AssinaturaErro() {
  const navigate = useNavigate();
  const { details } = useMercadoPagoReturnDetails();

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Pagamento nao concluido</CardTitle>
            <CardDescription>O Mercado Pago nos devolveu um status de falha para esta tentativa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Nenhuma cobranca foi efetuada. Volte para a pagina de assinatura e gere um novo link para tentar novamente ou
              escolha outro metodo de pagamento.
            </p>
            <MercadoPagoReturnDetails details={details} />
            <div className="space-y-2">
              <Button onClick={() => navigate("/assinatura")} className="w-full">
                Tentar novamente
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

