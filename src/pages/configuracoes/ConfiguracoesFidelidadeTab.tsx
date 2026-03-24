import { ChangeEvent } from "react";
import { Gift, ImagePlus, Medal, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  grantsFreeAppointment: boolean;
  imageFile: File | null;
  imagePreview: string | null;
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
  onRewardDraftImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRewardImageChange: (id: number, event: ChangeEvent<HTMLInputElement>) => void;
  onRewardImageRemove: (id: number) => void;
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
  onRewardDraftImageChange,
  onRewardImageChange,
  onRewardImageRemove,
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
          <CardDescription>Monte um catálogo visual de benefícios que seus clientes podem resgatar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-muted/20 p-5 xl:grid-cols-[220px,1fr]">
            <div className="space-y-3">
              <Label>Foto da recompensa</Label>
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background">
                {rewardDraft.imagePreview ? (
                  <img src={rewardDraft.imagePreview} alt="Prévia da recompensa" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <Gift className="h-8 w-8" />
                    <span className="text-xs">Adicione uma imagem para destacar a recompensa</span>
                  </div>
                )}
              </div>
              <input id="reward-draft-image" type="file" accept="image/*" className="hidden" onChange={onRewardDraftImageChange} />
              <Label
                htmlFor="reward-draft-image"
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
              >
                <ImagePlus className="h-4 w-4" />
                {rewardDraft.imagePreview ? "Trocar foto" : "Adicionar foto"}
              </Label>
              <p className="text-xs text-muted-foreground">PNG ou JPG até 4MB.</p>
            </div>
            <div className="grid gap-4">
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
                  rows={4}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-[180px,minmax(0,1fr)] lg:items-end">
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
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3">
                  <div>
                    <Label>Recompensa ativa</Label>
                    <p className="text-xs text-muted-foreground">Disponível para aparecer aos clientes.</p>
                  </div>
                  <Switch
                    checked={rewardDraft.active}
                    onCheckedChange={(checked) => onRewardDraftChange({ active: Boolean(checked) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3">
                <div>
                  <Label>Gera agendamento gratis</Label>
                  <p className="text-xs text-muted-foreground">Ao resgatar, o cliente ganha um horario sem custo.</p>
                </div>
                <Switch
                  checked={rewardDraft.grantsFreeAppointment}
                  onCheckedChange={(checked) => onRewardDraftChange({ grantsFreeAppointment: Boolean(checked) })}
                />
              </div>
              <Button onClick={onCreateReward} disabled={creatingReward}>
                {creatingReward ? "Salvando..." : "Adicionar recompensa"}
              </Button>
            </div>
          </div>

          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma recompensa cadastrada ainda.</p>
          ) : (
            <div className="grid gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <div className="grid gap-5 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={reward.active ? "default" : "outline"}>
                        {reward.active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge variant="secondary">{reward.points_cost} pts</Badge>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[200px,minmax(0,1fr)]">
                      <div className="space-y-3">
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                          {reward.image_preview ? (
                            <img src={reward.image_preview} alt={reward.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                              <Medal className="h-8 w-8" />
                              <span className="text-xs">Sem foto</span>
                            </div>
                          )}
                        </div>
                        <input
                          id={`reward-image-${reward.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => onRewardImageChange(reward.id, event)}
                        />
                        <div className="flex flex-col gap-2">
                          <Label
                            htmlFor={`reward-image-${reward.id}`}
                            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
                          >
                            <ImagePlus className="h-4 w-4" />
                            {reward.image_preview ? "Trocar foto" : "Adicionar foto"}
                          </Label>
                          {reward.image_preview ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="justify-start px-0 text-rose-600"
                              onClick={() => onRewardImageRemove(reward.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover foto
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="min-w-0 grid gap-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),180px] lg:items-start">
                          <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input
                              value={reward.name}
                              onChange={(event) => onRewardChange(reward.id, { name: event.target.value })}
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
                        </div>
                        <div className="grid gap-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={reward.description ?? ""}
                            onChange={(event) => onRewardChange(reward.id, { description: event.target.value })}
                            rows={4}
                          />
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                              <div>
                                <Label>Ativa</Label>
                                <p className="text-xs text-muted-foreground">Exibir aos clientes.</p>
                              </div>
                              <Switch
                                checked={reward.active}
                                onCheckedChange={(checked) => onRewardChange(reward.id, { active: Boolean(checked) })}
                              />
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                              <div>
                                <Label>Agendamento gratis</Label>
                                <p className="text-xs text-muted-foreground">O cliente pode usar esta recompensa para marcar um horario sem custo.</p>
                              </div>
                              <Switch
                                checked={Boolean(reward.grants_free_appointment)}
                                onCheckedChange={(checked) =>
                                  onRewardChange(reward.id, { grants_free_appointment: Boolean(checked) })
                                }
                              />
                            </div>
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
