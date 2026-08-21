import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarClock, CreditCard, History, Minus, Plus, ReceiptText, Search, ShoppingCart, Trash2, UserRound } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchAgendamentosPorData, fetchServicos, formatarData, formatarPreco } from "@/services/agendaService";
import {
  closeAppointmentSale,
  closeDirectSale,
  fetchAppointmentSale,
  fetchProducts,
  fetchSales,
  type Product,
  type Sale,
} from "@/services/inventoryService";
import type { Agendamento, Servico } from "@/data/mockData";

type CartItem = {
  key: string;
  type: "service" | "product";
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
};

type ProductCartItem = { product: Product; quantity: number };

const numberValue = (value: string) => Number(value.replace(",", ".")) || 0;
const today = () => format(new Date(), "yyyy-MM-dd");

export default function Caixa() {
  const { toast } = useToast();
  const [services, setServices] = useState<Servico[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("0");
  const [addition, setAddition] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [closingFree, setClosingFree] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<Agendamento | null>(null);
  const [appointmentSale, setAppointmentSale] = useState<Sale | null>(null);
  const [appointmentProducts, setAppointmentProducts] = useState<ProductCartItem[]>([]);
  const [selectedAppointmentProductId, setSelectedAppointmentProductId] = useState("");
  const [selectedAppointmentProductQuantity, setSelectedAppointmentProductQuantity] = useState("1");
  const [appointmentDiscount, setAppointmentDiscount] = useState("0");
  const [appointmentAddition, setAppointmentAddition] = useState("0");
  const [appointmentPaymentMethod, setAppointmentPaymentMethod] = useState("pix");
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [closingAppointment, setClosingAppointment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [serviceData, productData, appointmentData, historyData] = await Promise.all([
        fetchServicos(),
        fetchProducts(),
        fetchAgendamentosPorData(today()),
        fetchSales({ status: "closed" }),
      ]);
      setServices(serviceData);
      setProducts(productData);
      setAppointments(appointmentData.filter((item) => item.status !== "cancelado"));
      setSalesHistory(historyData);
    } catch (error) {
      toast({ title: "Erro ao carregar caixa", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const term = search.trim().toLowerCase();
  const filteredServices = services.filter((item) => item.nome.toLowerCase().includes(term));
  const filteredProducts = products.filter((item) => `${item.name} ${item.sku ?? ""}`.toLowerCase().includes(term));

  const subtotalServices = cart.filter((item) => item.type === "service").reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalProducts = cart.filter((item) => item.type === "product").reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotalServices + subtotalProducts + numberValue(addition) - numberValue(discount));

  const appointmentServicesTotal = appointmentSale?.services_total ?? selectedAppointment?.preco ?? 0;
  const appointmentProductsTotal = appointmentProducts.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);
  const appointmentTotal = Math.max(
    0,
    appointmentServicesTotal + appointmentProductsTotal + numberValue(appointmentAddition) - numberValue(appointmentDiscount),
  );

  const historyTerm = historySearch.trim().toLowerCase();
  const filteredSalesHistory = salesHistory.filter((sale) => {
    if (!historyTerm) return true;
    return [
      `#${sale.id}`,
      sale.customer_name ?? "",
      sale.customer_phone ?? "",
      sale.payment_method ?? "",
      sale.appointment_id ? `agendamento ${sale.appointment_id}` : "caixa livre",
      sale.items.map((item) => item.description).join(" "),
    ].join(" ").toLowerCase().includes(historyTerm);
  });
  const historyTotal = filteredSalesHistory.reduce((sum, sale) => sum + sale.total, 0);
  const historyServicesTotal = filteredSalesHistory.reduce((sum, sale) => sum + sale.services_total, 0);
  const historyProductsTotal = filteredSalesHistory.reduce((sum, sale) => sum + sale.products_total, 0);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.key === item.key);
      if (existing) {
        if (existing.stock !== undefined && existing.quantity + 1 > existing.stock) {
          toast({ title: "Estoque insuficiente", description: `${existing.name} tem ${existing.stock} unidade(s).`, variant: "destructive" });
          return current;
        }
        return current.map((cartItem) => cartItem.key === item.key ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart((current) => current
      .map((item) => {
        if (item.key !== key) return item;
        const nextQuantity = item.quantity + delta;
        if (item.stock !== undefined && nextQuantity > item.stock) {
          toast({ title: "Estoque insuficiente", description: `${item.name} tem ${item.stock} unidade(s).`, variant: "destructive" });
          return item;
        }
        return { ...item, quantity: nextQuantity };
      })
      .filter((item) => item.quantity > 0));
  };

  const clearFreeSale = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("0");
    setAddition("0");
    setPaymentMethod("pix");
    setSearch("");
  };

  const finishFreeSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione um serviço ou produto para finalizar.", variant: "destructive" });
      return;
    }

    setClosingFree(true);
    try {
      const sale = await closeDirectSale({
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        services: cart.filter((item) => item.type === "service").map((item) => ({ service_id: item.id, quantity: item.quantity })),
        products: cart.filter((item) => item.type === "product").map((item) => ({ product_id: item.id, quantity: item.quantity })),
        discount: numberValue(discount),
        addition: numberValue(addition),
        payment_method: paymentMethod,
      });
      toast({ title: "Venda livre finalizada", description: `Venda #${sale.id} no total de ${formatarPreco(sale.total)}.` });
      clearFreeSale();
      await loadData();
    } catch (error) {
      toast({ title: "Erro ao finalizar venda", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setClosingFree(false);
    }
  };

  const selectAppointment = async (appointment: Agendamento) => {
    setSelectedAppointment(appointment);
    setAppointmentLoading(true);
    try {
      const sale = await fetchAppointmentSale(appointment.id);
      setAppointmentSale(sale);
      setAppointmentProducts([]);
      setSelectedAppointmentProductId("");
      setSelectedAppointmentProductQuantity("1");
      setAppointmentDiscount(String(sale.discount || 0));
      setAppointmentAddition(String(sale.addition || 0));
      setAppointmentPaymentMethod(sale.payment_method || "pix");
    } catch (error) {
      toast({ title: "Erro ao abrir caixa do agendamento", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setAppointmentLoading(false);
    }
  };

  const addAppointmentProduct = () => {
    const product = products.find((item) => item.id.toString() === selectedAppointmentProductId);
    const quantity = Math.max(1, Math.round(numberValue(selectedAppointmentProductQuantity)));
    if (!product) return;
    if (product.stock_quantity <= 0 || quantity > product.stock_quantity) {
      toast({ title: "Estoque insuficiente", description: `${product.name} tem ${product.stock_quantity} unidade(s).`, variant: "destructive" });
      return;
    }
    setAppointmentProducts((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + quantity > product.stock_quantity) {
          toast({ title: "Estoque insuficiente", description: `${product.name} tem ${product.stock_quantity} unidade(s).`, variant: "destructive" });
          return current;
        }
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { product, quantity }];
    });
    setSelectedAppointmentProductId("");
    setSelectedAppointmentProductQuantity("1");
  };

  const updateAppointmentProduct = (productId: number, delta: number) => {
    setAppointmentProducts((current) => current
      .map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const finishAppointmentSale = async () => {
    if (!selectedAppointment) return;
    setClosingAppointment(true);
    try {
      const sale = await closeAppointmentSale(selectedAppointment.id, {
        products: appointmentProducts.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        discount: numberValue(appointmentDiscount),
        addition: numberValue(appointmentAddition),
        payment_method: appointmentPaymentMethod,
      });
      toast({ title: "Caixa do agendamento fechado", description: `Total recebido: ${formatarPreco(sale.total)}.` });
      setSelectedAppointment(null);
      setAppointmentSale(null);
      setAppointmentProducts([]);
      setSelectedAppointmentProductId("");
      setSelectedAppointmentProductQuantity("1");
      await loadData();
    } catch (error) {
      toast({ title: "Erro ao fechar agendamento", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setClosingAppointment(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Use o caixa livre para vendas aleatórias ou feche o atendimento de um agendamento do momento.</p>
        </div>

        <Tabs defaultValue="free" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="free">Caixa livre</TabsTrigger>
            <TabsTrigger value="appointments">Agendamentos do momento</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="free">
            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Buscar serviço ou produto" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="services">
                  <TabsList>
                    <TabsTrigger value="services">Serviços</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="services" className="mt-4 grid gap-3 md:grid-cols-2">
                    {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
                    {filteredServices.map((service) => (
                      <button key={service.id} className="rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary" onClick={() => addItem({ key: `service-${service.id}`, type: "service", id: service.id, name: service.nome, price: service.preco })}>
                        <p className="font-semibold">{service.nome}</p>
                        <p className="text-sm text-muted-foreground">{service.duracao} min</p>
                        <p className="mt-2 font-bold text-primary">{formatarPreco(service.preco)}</p>
                      </button>
                    ))}
                  </TabsContent>
                  <TabsContent value="products" className="mt-4 grid gap-3 md:grid-cols-2">
                    {filteredProducts.map((product) => (
                      <button key={product.id} disabled={product.stock_quantity <= 0} className="rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary disabled:opacity-50" onClick={() => addItem({ key: `product-${product.id}`, type: "product", id: product.id, name: product.name, price: product.sale_price, stock: product.stock_quantity })}>
                        <div className="flex items-center justify-between gap-2"><p className="font-semibold">{product.name}</p>{product.low_stock && <Badge variant="destructive">Baixo</Badge>}</div>
                        <p className="text-sm text-muted-foreground">Estoque {product.stock_quantity}</p>
                        <p className="mt-2 font-bold text-primary">{formatarPreco(product.sale_price)}</p>
                      </button>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>

              <SaleSummary
                title="Venda livre atual"
                description="Para consumo ou serviço sem agendamento."
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                cart={cart}
                updateQuantity={updateQuantity}
                removeItem={(key) => setCart((current) => current.filter((item) => item.key !== key))}
                servicesTotal={subtotalServices}
                productsTotal={subtotalProducts}
                discount={discount}
                setDiscount={setDiscount}
                addition={addition}
                setAddition={setAddition}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                total={total}
                onFinish={finishFreeSale}
                onClear={clearFreeSale}
                closing={closingFree}
              />
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Agendamentos de hoje</CardTitle>
                  <CardDescription>{formatarData(today())}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appointments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum agendamento para hoje.</p> : null}
                  {appointments.map((appointment) => (
                    <button key={appointment.id} onClick={() => selectAppointment(appointment)} className={`w-full rounded-lg border p-3 text-left transition hover:border-primary ${selectedAppointment?.id === appointment.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{appointment.horario} - {appointment.cliente}</p>
                          <p className="text-sm text-muted-foreground">{appointment.servico}</p>
                        </div>
                        <Badge variant={appointment.status === "concluido" ? "secondary" : "outline"}>{appointment.status}</Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Caixa do agendamento</CardTitle>
                  <CardDescription>{selectedAppointment ? `${selectedAppointment.cliente} às ${selectedAppointment.horario}` : "Selecione um agendamento para abrir o caixa vinculado."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedAppointment ? (
                    <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Escolha um agendamento de hoje para lançar produtos consumidos e fechar o atendimento.</div>
                  ) : appointmentLoading ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Carregando caixa do agendamento...</p>
                  ) : appointmentSale?.status === "closed" || selectedAppointment.status === "concluido" ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">Este agendamento já está fechado.</div>
                  ) : (
                    <>
                      <div className="rounded-lg bg-muted/50 p-4 text-sm">
                        <p className="font-semibold text-foreground">Serviços do agendamento</p>
                        {(appointmentSale?.items ?? []).filter((item) => item.type === "service").map((item) => (
                          <div key={item.id} className="mt-2 flex justify-between"><span>{item.description}</span><strong>{formatarPreco(item.total)}</strong></div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between"><p className="font-semibold">Produtos consumidos</p><span className="text-sm text-muted-foreground">Selecione e adicione</span></div>
                        <div className="grid gap-2 md:grid-cols-[1fr_96px_auto]">
                          <Select value={selectedAppointmentProductId} onValueChange={setSelectedAppointmentProductId}>
                            <SelectTrigger className="h-14">
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()} disabled={product.stock_quantity <= 0}>
                                  <ProductOption product={product} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input value={selectedAppointmentProductQuantity} onChange={(event) => setSelectedAppointmentProductQuantity(event.target.value)} placeholder="Qtd" />
                          <Button type="button" onClick={addAppointmentProduct} disabled={!selectedAppointmentProductId}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {appointmentProducts.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div><p className="font-medium">{item.product.name}</p><p className="text-xs text-muted-foreground">{item.quantity} x {formatarPreco(item.product.sale_price)}</p></div>
                            <div className="flex items-center gap-1"><Button size="icon" variant="ghost" onClick={() => updateAppointmentProduct(item.product.id, -1)}><Minus className="h-4 w-4" /></Button><span className="w-7 text-center text-sm">{item.quantity}</span><Button size="icon" variant="ghost" onClick={() => updateAppointmentProduct(item.product.id, 1)}><Plus className="h-4 w-4" /></Button></div>
                          </div>
                        ))}
                      </div>

                      <CheckoutTotals
                        servicesTotal={appointmentServicesTotal}
                        productsTotal={appointmentProductsTotal}
                        discount={appointmentDiscount}
                        setDiscount={setAppointmentDiscount}
                        addition={appointmentAddition}
                        setAddition={setAppointmentAddition}
                        paymentMethod={appointmentPaymentMethod}
                        setPaymentMethod={setAppointmentPaymentMethod}
                        total={appointmentTotal}
                      />

                      <Button className="w-full gap-2" onClick={finishAppointmentSale} disabled={closingAppointment}><CreditCard className="h-4 w-4" /> Fechar caixa do agendamento</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Caixas fechados</CardDescription><CardTitle>{filteredSalesHistory.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Total recebido</CardDescription><CardTitle>{formatarPreco(historyTotal)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Serviços</CardDescription><CardTitle>{formatarPreco(historyServicesTotal)}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Produtos</CardDescription><CardTitle>{formatarPreco(historyProductsTotal)}</CardTitle></CardHeader></Card>
              </div>

              <Card>
                <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Histórico de caixas</CardTitle>
                    <CardDescription>Vendas livres e caixas de agendamento já fechados.</CardDescription>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Buscar venda, cliente ou item" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando histórico...</p> : null}
                  {!loading && filteredSalesHistory.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum caixa fechado encontrado.</p> : null}
                  {filteredSalesHistory.map((sale) => (
                    <div key={sale.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">Venda #{sale.id}</p>
                            <Badge variant={sale.appointment_id ? "secondary" : "outline"}>{sale.appointment_id ? "Agendamento" : "Caixa livre"}</Badge>
                            {sale.payment_method ? <Badge variant="outline">{paymentLabel(sale.payment_method)}</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {sale.customer_name || "Cliente não informado"}
                            {sale.customer_phone ? ` • ${sale.customer_phone}` : ""}
                            {sale.closed_at ? ` • ${formatDateTime(sale.closed_at)}` : ""}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xl font-bold text-primary">{formatarPreco(sale.total)}</p>
                          <p className="text-xs text-muted-foreground">Serv. {formatarPreco(sale.services_total)} • Prod. {formatarPreco(sale.products_total)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {sale.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">{item.type === "service" ? "Serviço" : "Produto"} • {item.quantity} x {formatarPreco(item.unit_price)}</p>
                            </div>
                            <strong>{formatarPreco(item.total)}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
                        <span>Acréscimo: <strong className="text-foreground">{formatarPreco(sale.addition)}</strong></span>
                        <span>Desconto: <strong className="text-foreground">{formatarPreco(sale.discount)}</strong></span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}


function paymentLabel(value: string) {
  const labels: Record<string, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_debito: "Cartão débito",
    cartao_credito: "Cartão crédito",
  };
  return labels[value] ?? value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function ProductOption({ product }: { product: Product }) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="h-9 w-9 rounded-md border border-border object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
          IMG
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{formatarPreco(product.sale_price)} • est. {product.stock_quantity}</p>
      </div>
    </div>
  );
}

function SaleSummary({
  title,
  description,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  cart,
  updateQuantity,
  removeItem,
  servicesTotal,
  productsTotal,
  discount,
  setDiscount,
  addition,
  setAddition,
  paymentMethod,
  setPaymentMethod,
  total,
  onFinish,
  onClear,
  closing,
}: {
  title: string;
  description: string;
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  cart: CartItem[];
  updateQuantity: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  servicesTotal: number;
  productsTotal: number;
  discount: string;
  setDiscount: (value: string) => void;
  addition: string;
  setAddition: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  total: number;
  onFinish: () => void;
  onClear: () => void;
  closing: boolean;
}) {
  return (
    <Card className="h-fit xl:sticky xl:top-6">
      <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> {title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-2"><Label className="flex items-center gap-1"><UserRound className="h-3 w-3" /> Cliente</Label><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome do cliente" /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Opcional" /></div>
        </div>
        <div className="space-y-2">
          {cart.length === 0 ? <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground"><ShoppingCart className="mx-auto mb-2 h-5 w-5" /> Nenhum item adicionado.</div> : cart.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.quantity} x {formatarPreco(item.price)}</p></div>
              <div className="flex items-center gap-1"><Button size="icon" variant="ghost" onClick={() => updateQuantity(item.key, -1)}><Minus className="h-4 w-4" /></Button><span className="w-7 text-center text-sm">{item.quantity}</span><Button size="icon" variant="ghost" onClick={() => updateQuantity(item.key, 1)}><Plus className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.key)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
        <CheckoutTotals servicesTotal={servicesTotal} productsTotal={productsTotal} discount={discount} setDiscount={setDiscount} addition={addition} setAddition={setAddition} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} total={total} />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button className="gap-2" onClick={onFinish} disabled={closing || cart.length === 0}><CreditCard className="h-4 w-4" /> Finalizar venda</Button><Button variant="outline" onClick={onClear} disabled={closing}>Limpar</Button></div>
      </CardContent>
    </Card>
  );
}

function CheckoutTotals({ servicesTotal, productsTotal, discount, setDiscount, addition, setAddition, paymentMethod, setPaymentMethod, total }: {
  servicesTotal: number;
  productsTotal: number;
  discount: string;
  setDiscount: (value: string) => void;
  addition: string;
  setAddition: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  total: number;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <div className="space-y-2"><Label>Desconto</Label><Input value={discount} onChange={(event) => setDiscount(event.target.value)} /></div>
        <div className="space-y-2"><Label>Acréscimo</Label><Input value={addition} onChange={(event) => setAddition(event.target.value)} /></div>
        <div className="space-y-2"><Label>Pagamento</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="cartao_debito">Cartão débito</SelectItem><SelectItem value="cartao_credito">Cartão crédito</SelectItem></SelectContent></Select></div>
      </div>
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex justify-between"><span>Serviços</span><strong>{formatarPreco(servicesTotal)}</strong></div>
        <div className="flex justify-between"><span>Produtos</span><strong>{formatarPreco(productsTotal)}</strong></div>
        <div className="flex justify-between"><span>Acréscimo</span><strong>{formatarPreco(numberValue(addition))}</strong></div>
        <div className="flex justify-between"><span>Desconto</span><strong>- {formatarPreco(numberValue(discount))}</strong></div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg"><span>Total</span><strong className="text-primary">{formatarPreco(total)}</strong></div>
      </div>
    </>
  );
}
