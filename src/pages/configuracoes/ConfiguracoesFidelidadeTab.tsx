import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import type { LoyaltyReward, LoyaltyRuleType } from "@/services/loyaltyService";

export type LoyaltySettingsForm = {
  enabled: boolean;
  ruleType: LoyaltyRuleType;
  spendAmount: string;
  pointsPerVisit: string;
  expirationEnabled: boolean;
  expirationDays: string;
};

export type LoyaltyRewardDraft = {
  name: string;
  description: string;
  pointsCost: string;
  active: boolean;
};

interface ConfiguracoesFidelidadeTabProps {
  form: LoyaltySettingsForm;
  onFormChange: (patch: Partial<LoyaltySettingsForm>) => void;
  onSaveSettings: () => void;
  savingSettings: boolean;
  rewards: LoyaltyReward[];
  onRewardChange: (id: number, patch: Partial<LoyaltyReward>) => void;
  onSaveReward: (reward: LoyaltyReward) => void;
  onDeleteReward: (id: number) => void;
  rewardDraft: LoyaltyRewardDraft;
  onRewardDraftChange: (patch: Partial<LoyaltyRewardDraft>) => void;
  onCreateReward: () => void;
  creatingReward: boolean;
}

export function ConfiguracoesFidelidadeTab({
  form,
  onFormChange,
  onSaveSettings,
  savingSettings,
  rewards,
  onRewardChange,
  onSaveReward,
  onDeleteReward,
  rewardDraft,
  onRewardDraftChange,
  onCreateReward,
  creatingReward,
}: ConfiguracoesFidelidadeTabProps) {
  return (
    <TabsContent value="fidelidade" className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Programa de fidelidade</CardTitle>
          <CardDescription>Configure como os pontos são gerados e se expiram.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-base">Ativar fidelidade</Label>
              <p className="text-xs text-muted-foreground">Clientes ganham pontos ao concluir um atendimento.</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(checked) => onFormChange({ enabled: Boolean(checked) })} />
          </div>

          <div className="grid gap-2">
            <Label>Regra de pontuação</Label>
            <Select value={form.ruleType} onValueChange={(value) => onFormChange({ ruleType: value as LoyaltyRuleType })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spend">Valor gasto</SelectItem>
                <SelectItem value="visits">Presença confirmada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.ruleType === "spend" ? (
            <div className="grid gap-2">
              <Label>Valor por ponto (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.spendAmount}
                onChange={(event) => onFormChange({ spendAmount: event.target.value })}
                placeholder="Ex.: 10.00"
              />
              <p className="text-xs text-muted-foreground">Ex.: R$10,00 = 1 ponto.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Pontos por presença</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.pointsPerVisit}
                onChange={(event) => onFormChange({ pointsPerVisit: event.target.value })}
                placeholder="Ex.: 1"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-base">Pontos expiram</Label>
              <p className="text-xs text-muted-foreground">Defina um prazo de validade para os pontos.</p>
            </div>
            <Switch
              checked={form.expirationEnabled}
              onCheckedChange={(checked) => onFormChange({ expirationEnabled: Boolean(checked) })}
            />
          </div>

          {form.expirationEnabled && (
            <div className="grid gap-2">
              <Label>Expiram em (dias)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.expirationDays}
                onChange={(event) => onFormChange({ expirationDays: event.target.value })}
                placeholder="Ex.: 180"
              />
            </div>
          )}

          <Button onClick={onSaveSettings} disabled={savingSettings}>
            {savingSettings ? "Salvando..." : "Salvar regras"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recompensas</CardTitle>
          <CardDescription>Crie e gerencie as recompensas que seus clientes podem resgatar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 rounded-lg border border-border/60 p-4">
            <div className="grid gap-2">
              <Label>Nome da recompensa</Label>
              <Input
                value={rewardDraft.name}
                onChange={(event) => onRewardDraftChange({ name: event.target.value })}
                placeholder="Ex.: Corte grátis"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={rewardDraft.description}
                onChange={(event) => onRewardDraftChange({ description: event.target.value })}
                placeholder="Detalhes, restrições ou validade."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Custo em pontos</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={rewardDraft.pointsCost}
                onChange={(event) => onRewardDraftChange({ pointsCost: event.target.value })}
                placeholder="Ex.: 20"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Recompensa ativa</Label>
              <Switch
                checked={rewardDraft.active}
                onCheckedChange={(checked) => onRewardDraftChange({ active: Boolean(checked) })}
              />
            </div>
            <Button onClick={onCreateReward} disabled={creatingReward}>
              {creatingReward ? "Salvando..." : "Adicionar recompensa"}
            </Button>
          </div>

          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma recompensa cadastrada ainda.</p>
          ) : (
            <div className="grid gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="rounded-lg border border-border/60 p-4">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Nome</Label>
                      <Input
                        value={reward.name}
                        onChange={(event) => onRewardChange(reward.id, { name: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={reward.description ?? ""}
                        onChange={(event) => onRewardChange(reward.id, { description: event.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Custo em pontos</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={reward.points_cost}
                        onChange={(event) =>
                          onRewardChange(reward.id, { points_cost: Number(event.target.value || 0) })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativa</Label>
                      <Switch
                        checked={reward.active}
                        onCheckedChange={(checked) => onRewardChange(reward.id, { active: Boolean(checked) })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => onSaveReward(reward)}>
                        Salvar
                      </Button>
                      <Button variant="destructive" onClick={() => onDeleteReward(reward.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
