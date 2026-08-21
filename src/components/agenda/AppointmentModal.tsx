import { useEffect, useState } from "react";
import { Phone, Calendar, Clock, Scissors, FileText, Check, Trash2, Star, MessageSquareText, Gift, ShoppingCart, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Agendamento } from "@/data/mockData";
import { formatarData, formatarPreco, cancelarAgendamento, concluirAgendamento } from "@/services/agendaService";
import { useToast } from "@/hooks/use-toast";
import { buildWhatsAppUrl, openWhatsAppChat } from "@/lib/whatsapp";
import { closeAppointmentSale, fetchAppointmentSale, fetchProducts, type Product, type Sale } from "@/services/inventoryService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppointmentModalProps {
  agendamento: Agendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AppointmentModal({ agendamento, open, onOpenChange, onUpdate }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [consumedProducts, setConsumedProducts] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [discount, setDiscount] = useState("0");
  const [addition, setAddition] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !agendamento || !checkoutOpen) return;

    setCheckoutLoading(true);
    Promise.all([fetchAppointmentSale(agendamento.id), fetchProducts()])
      .then(([saleData, productData]) => {
        setSale(saleData);
        setProducts(productData);
        setConsumedProducts(
          saleData.items
            .filter((item) => item.type === "product" && item.product_id)
            .map((item) => ({
              product: productData.find((product) => product.id === item.product_id) ?? {
                id: item.product_id ?? 0,
                name: item.description,
                sale_price: item.unit_price,
                stock_quantity: item.quantity,
                minimum_stock: 0,
                active: true,
                low_stock: false,
              },
              quantity: item.quantity,
            })),
        );
        setDiscount(String(saleData.discount || 0));
        setAddition(String(saleData.addition || 0));
        setPaymentMethod(saleData.payment_method || "dinheiro");
      })
      .catch((error) => {
        toast({ title: "Erro ao abrir caixa", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
      })
      .finally(() => setCheckoutLoading(false));
  }, [open, agendamento?.id, checkoutOpen, toast]);

  if (!agendamento) return null;

  const statusConfig = {
    confirmado: { label: "Confirmado", className: "bg-primary text-primary-foreground" },
    concluido: { label: "Concluído", className: "bg-success text-success-foreground" },
    cancelado: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
  };

  const status = statusConfig[agendamento.status];

  const currencyValue = (value: string) => Number(value.replace(",", ".")) || 0;
  const productsTotal = consumedProducts.reduce((total, item) => total + item.product.sale_price * item.quantity, 0);
  const servicesTotal = sale?.services_total ?? agendamento.preco;
  const checkoutTotal = Math.max(0, servicesTotal + productsTotal + currencyValue(addition) - currencyValue(discount));
  const saleClosed = sale?.status === "closed" || agendamento.status === "concluido";

  const addConsumedProduct = () => {
    const product = products.find((item) => item.id.toString() === selectedProductId);
    const quantity = Math.max(1, Math.round(currencyValue(selectedQuantity)));
    if (!product) return;
    if (quantity > product.stock_quantity) {
      toast({ title: "Estoque insuficiente", description: `${product.name} tem ${product.stock_quantity} unidade(s).`, variant: "destructive" });
      return;
    }
    setConsumedProducts((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { product, quantity }];
    });
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const updateConsumedQuantity = (productId: number, delta: number) => {
    setConsumedProducts((current) => current
      .map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const handleCloseSale = async () => {
    setCheckoutLoading(true);
    try {
      const closedSale = await closeAppointmentSale(agendamento.id, {
        products: consumedProducts.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        discount: currencyValue(discount),
        addition: currencyValue(addition),
        payment_method: paymentMethod,
      });
      setSale(closedSale);
      toast({ title: "Atendimento fechado", description: `Total recebido: ${formatarPreco(closedSale.total)}.` });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro ao fechar atendimento", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConcluir = async () => {
    setLoading(true);
    try {
      await concluirAgendamento(agendamento.id);
      toast({
        title: "Agendamento concluído",
        description: `Atendimento de ${agendamento.cliente} marcado como concluído.`,
      });
      onUpdate();
      onOpenChange(false);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível concluir o agendamento.",
        variant: "destructive",
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
        title: "Agendamento cancelado",
        description: `Agendamento de ${agendamento.cliente} foi cancelado.`,
      });
      onUpdate();
      onOpenChange(false);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = `Olá ${agendamento.cliente}! Aqui é da equipe da ${agendamento.company.nome}. Estou entrando em contato sobre seu atendimento do dia ${formatarData(agendamento.data)} às ${agendamento.horario}.`;
    const opened = openWhatsAppChat(agendamento.telefone, message);

    if (!opened) {
      toast({
        title: "WhatsApp indisponível",
        description: "Não foi possível abrir a conversa. Verifique o telefone do cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                <span className="text-lg font-bold text-primary">{agendamento.cliente.charAt(0)}</span>
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
              <span className="font-bold text-primary">{formatarPreco(agendamento.preco)}</span>
            </div>

            {buildWhatsAppUrl(agendamento.telefone) ? (
              <Button variant="outline" className="w-full gap-2" onClick={handleWhatsAppContact}>
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                Chamar no WhatsApp
              </Button>
            ) : null}

            {Boolean(agendamento.loyalty?.available_rewards_count) && (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                  <Gift className="h-4 w-4 text-amber-600" />
                  Recompensa disponível para este cliente
                </div>
                <p className="mt-1 text-sm text-amber-900">
                  {agendamento.loyalty?.available_rewards_count === 1
                    ? "Este cliente já pode resgatar 1 recompensa."
                    : `Este cliente já pode resgatar ${agendamento.loyalty?.available_rewards_count} recompensas.`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agendamento.loyalty?.available_rewards.map((reward) => (
                    <Badge key={reward.id} variant="outline" className="border-amber-300 bg-white text-amber-900">
                      {reward.name} • {reward.points_cost} pts
                    </Badge>
                  ))}
                </div>
              </div>
            )}

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

          <div className="rounded-lg border border-border p-3">
            <Button variant="outline" className="w-full justify-between" onClick={() => setCheckoutOpen((value) => !value)}>
              <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Caixa do atendimento</span>
              <Badge variant={saleClosed ? "secondary" : "outline"}>{saleClosed ? "Fechado" : "Abrir"}</Badge>
            </Button>

            {checkoutOpen && (
              <div className="mt-4 space-y-4">
                {checkoutLoading && !sale ? <p className="text-sm text-muted-foreground">Carregando caixa...</p> : null}
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between"><span>Serviços</span><strong>{formatarPreco(servicesTotal)}</strong></div>
                  <div className="flex justify-between"><span>Produtos</span><strong>{formatarPreco(productsTotal)}</strong></div>
                  <div className="flex justify-between"><span>Acréscimos</span><strong>{formatarPreco(currencyValue(addition))}</strong></div>
                  <div className="flex justify-between"><span>Descontos</span><strong>- {formatarPreco(currencyValue(discount))}</strong></div>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-base"><span>Total</span><strong className="text-primary">{formatarPreco(checkoutTotal)}</strong></div>
                </div>

                {!saleClosed && (
                  <>
                    <div className="grid gap-2 sm:grid-cols-[1fr_80px_auto]">
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger><SelectValue placeholder="Adicionar produto consumido" /></SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()} disabled={product.stock_quantity <= 0}>
                              {product.name} • {formatarPreco(product.sale_price)} • est. {product.stock_quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input value={selectedQuantity} onChange={(event) => setSelectedQuantity(event.target.value)} />
                      <Button type="button" onClick={addConsumedProduct}><Plus className="h-4 w-4" /></Button>
                    </div>

                    {consumedProducts.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                        <div><p className="font-medium">{item.product.name}</p><p className="text-muted-foreground">{item.quantity} x {formatarPreco(item.product.sale_price)}</p></div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => updateConsumedQuantity(item.product.id, -1)}><Minus className="h-4 w-4" /></Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button size="icon" variant="ghost" onClick={() => updateConsumedQuantity(item.product.id, 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1"><Label>Desconto</Label><Input value={discount} onChange={(event) => setDiscount(event.target.value)} /></div>
                      <div className="space-y-1"><Label>Acréscimo</Label><Input value={addition} onChange={(event) => setAddition(event.target.value)} /></div>
                      <div className="space-y-1"><Label>Pagamento</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="pix">Pix</SelectItem><SelectItem value="cartao_credito">Cartão crédito</SelectItem><SelectItem value="cartao_debito">Cartão débito</SelectItem></SelectContent></Select></div>
                    </div>

                    <Button className="w-full" onClick={handleCloseSale} disabled={checkoutLoading}>
                      <Check className="mr-2 h-4 w-4" /> Fechar atendimento
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {agendamento.status === "confirmado" && (
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleConcluir} disabled={loading}>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleCancelar} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {agendamento.feedback && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-900">
                <span className="flex items-center gap-1">
                  <MessageSquareText className="h-4 w-4" />
                  Feedback enviado
                </span>
                <span className="text-xs font-medium">
                  {formatAverage(agendamento.feedback.average_rating, agendamento.feedback)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {renderStars(calculateAverage(agendamento.feedback))}
              </div>
              {agendamento.feedback.comment && (
                <p className="text-sm text-emerald-900/90 leading-relaxed">{agendamento.feedback.comment}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

const renderStars = (rating: number) => {
  const safeRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.5;

  return Array.from({ length: 5 }).map((_, index) => {
    const position = index + 1;
    if (position <= fullStars) {
      return <Star key={position} className="h-4 w-4 text-amber-500 fill-amber-500" />;
    }
    if (hasHalf && position === fullStars + 1) {
      return <Star key={position} className="h-4 w-4 text-amber-500 fill-amber-500/60" />;
    }
    return <Star key={position} className="h-4 w-4 text-muted-foreground" />;
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
