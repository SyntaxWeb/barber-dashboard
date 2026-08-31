import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { ImageIcon, Package, Pencil, Plus, Save, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type Product,
  type ProductPayload,
} from "@/services/inventoryService";
import { formatarPreco } from "@/services/agendaService";
import { resolveMediaUrl } from "@/lib/media";

const emptyForm = {
  name: "",
  sku: "",
  sale_price: "",
  cost_price: "",
  stock_quantity: "0",
  minimum_stock: "0",
  description: "",
};

type ProductForm = typeof emptyForm;

const toNumber = (value: string) => Number(value.replace(",", ".")) || 0;

export default function Estoque() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<number, string>>({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (error) {
      toast({ title: "Erro ao carregar estoque", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);


  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      sale_price: String(product.sale_price).replace(".", ","),
      cost_price: product.cost_price !== null && product.cost_price !== undefined ? String(product.cost_price).replace(".", ",") : "",
      stock_quantity: String(product.stock_quantity),
      minimum_stock: String(product.minimum_stock),
      description: product.description ?? "",
    });
    setImageFile(null);
    setImagePreview(resolveMediaUrl(product.image_url));
    setRemoveImage(false);
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setRemoveImage(false);
    event.target.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(Boolean(editingProduct?.image_url));
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => `${product.name} ${product.sku ?? ""}`.toLowerCase().includes(term));
  }, [products, search]);

  const lowStockCount = products.filter((product) => product.low_stock).length;
  const stockValue = products.reduce((sum, product) => sum + product.stock_quantity * product.sale_price, 0);

  const handleSave = async () => {
    if (!form.name.trim() || !form.sale_price) {
      toast({ title: "Informe nome e preço de venda", variant: "destructive" });
      return;
    }

    const payload: ProductPayload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      description: form.description.trim() || undefined,
      sale_price: toNumber(form.sale_price),
      cost_price: form.cost_price ? toNumber(form.cost_price) : null,
      stock_quantity: Math.max(0, Math.round(toNumber(form.stock_quantity))),
      minimum_stock: Math.max(0, Math.round(toNumber(form.minimum_stock))),
      image: imageFile,
      remove_image: removeImage,
    };

    setSaving(true);
    try {
      const product = editingProduct
        ? await updateProduct(editingProduct.id, payload)
        : await createProduct(payload);
      setProducts((current) => {
        const next = editingProduct
          ? current.map((item) => (item.id === product.id ? product : item))
          : [...current, product];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      resetForm();
      toast({ title: editingProduct ? "Produto atualizado" : "Produto cadastrado", description: product.name });
    } catch (error) {
      toast({ title: editingProduct ? "Erro ao atualizar produto" : "Erro ao cadastrar produto", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (product: Product) => {
    const quantity = Math.round(toNumber(adjustments[product.id] ?? "0"));
    if (!quantity) return;

    try {
      const updated = await adjustProductStock(product.id, quantity, "Ajuste pela tela de estoque");
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setAdjustments((current) => ({ ...current, [product.id]: "" }));
      toast({ title: "Estoque atualizado", description: `${product.name}: ${quantity > 0 ? "+" : ""}${quantity} unidade(s).` });
    } catch (error) {
      toast({ title: "Erro ao ajustar estoque", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast({ title: "Produto desativado", description: product.name });
    } catch (error) {
      toast({ title: "Erro ao desativar produto", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produtos e estoque</h1>
            <p className="text-muted-foreground">Cadastre produtos e controle entradas, saídas e alertas simples.</p>
          </div>
          <Button variant="outline" onClick={loadProducts} disabled={loading}>Atualizar</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Produtos ativos</CardDescription><CardTitle>{products.length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Estoque baixo</CardDescription><CardTitle>{lowStockCount}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Valor em venda</CardDescription><CardTitle>{formatarPreco(stockValue)}</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">{editingProduct ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />} {editingProduct ? "Editar produto" : "Novo produto"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="space-y-2"><Label>Preço venda</Label><Input value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="0,00" /></div>
            <div className="space-y-2"><Label>Estoque</Label><Input value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mínimo</Label><Input value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-3"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2 md:col-span-2">
              <Label>Imagem</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground">
                  {imagePreview ? <img src={imagePreview} alt="Produto" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" />}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild><label htmlFor="product-image">Escolher</label></Button>
                  {imagePreview ? <Button type="button" variant="ghost" size="sm" onClick={clearImage}><X className="mr-1 h-4 w-4" /> Remover</Button> : null}
                </div>
                <input id="product-image" type="file" accept="image/*" className="hidden" onChange={onImageChange} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button className="w-full gap-2" onClick={handleSave} disabled={saving}><Save className="h-4 w-4" /> {editingProduct ? "Atualizar" : "Salvar"}</Button>
              {editingProduct ? <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4 text-primary" /> Lista de produtos</CardTitle>
              <CardDescription>Use valores positivos para entrada e negativos para saída manual.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar produto" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p> : filteredProducts.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p> : null}
            {filteredProducts.map((product) => (
              <div key={product.id} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground">
                    {product.image_url ? <img src={resolveMediaUrl(product.image_url) ?? undefined} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" />}
                  </div>
                  <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{product.name}</p>
                    {product.sku && <Badge variant="outline">{product.sku}</Badge>}
                    {product.low_stock && <Badge variant="destructive">Estoque baixo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatarPreco(product.sale_price)} • estoque {product.stock_quantity} • mínimo {product.minimum_stock}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <Input className="w-28" placeholder="+/- qtd" value={adjustments[product.id] ?? ""} onChange={(e) => setAdjustments({ ...adjustments, [product.id]: e.target.value })} />
                  <Button variant="secondary" onClick={() => handleAdjust(product)}>Aplicar</Button>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(product)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
