import type { Dispatch, SetStateAction } from "react";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import type { Servico } from "@/data/mockData";
import { formatarPreco } from "@/services/agendaService";

type ConfiguracoesServicosTabProps = {
  novoServicoNome: string;
  setNovoServicoNome: Dispatch<SetStateAction<string>>;
  novoServicoPreco: string;
  setNovoServicoPreco: Dispatch<SetStateAction<string>>;
  novoServicoDuracao: string;
  setNovoServicoDuracao: Dispatch<SetStateAction<string>>;
  onAddServico: () => void;
  servicos: Servico[];
  onDeleteServico: (id: number) => void;
};

export function ConfiguracoesServicosTab({
  novoServicoNome,
  setNovoServicoNome,
  novoServicoPreco,
  setNovoServicoPreco,
  novoServicoDuracao,
  setNovoServicoDuracao,
  onAddServico,
  servicos,
  onDeleteServico,
}: ConfiguracoesServicosTabProps) {
  return (
    <TabsContent value="servicos" className="space-y-6">
      <Card id="servicos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Serviços
          </CardTitle>
          <CardDescription>Gerencie os serviços oferecidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 p-4 border border-dashed border-border rounded-lg">
            <div className="flex-1">
              <Input
                placeholder="Nome do serviço"
                value={novoServicoNome}
                onChange={(event) => setNovoServicoNome(event.target.value)}
              />
            </div>
            <div className="w-full sm:w-32">
              <Input
                type="number"
                placeholder="Preço"
                value={novoServicoPreco}
                onChange={(event) => setNovoServicoPreco(event.target.value)}
              />
            </div>
            <div className="w-full sm:w-32">
              <Select value={novoServicoDuracao} onValueChange={setNovoServicoDuracao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onAddServico}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {servicos.map((servico) => (
              <div
                key={servico.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{servico.nome}</p>
                    <p className="text-sm text-muted-foreground">{servico.duracao} minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-primary">{formatarPreco(servico.preco)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteServico(servico.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
