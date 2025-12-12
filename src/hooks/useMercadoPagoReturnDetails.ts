import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export interface MercadoPagoReturnDetail {
  key: string;
  label: string;
  value: string;
}

export function useMercadoPagoReturnDetails() {
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const details: MercadoPagoReturnDetail[] = useMemo(() => {
    const collected: MercadoPagoReturnDetail[] = [];

    const status = params.get("status") ?? params.get("collection_status");
    if (status) {
      collected.push({
        key: "status",
        label: "Status informado",
        value: status,
      });
    }

    const identifier =
      params.get("preapproval_id") ??
      params.get("preapproval") ??
      params.get("payment_id") ??
      params.get("collection_id") ??
      params.get("subscription_id");
    if (identifier) {
      collected.push({
        key: "identifier",
        label: "Identificador",
        value: identifier,
      });
    }

    const merchantOrder = params.get("merchant_order_id");
    if (merchantOrder) {
      collected.push({
        key: "merchant_order",
        label: "Pedido",
        value: merchantOrder,
      });
    }

    const reference = params.get("external_reference") ?? params.get("external_reference_id");
    if (reference) {
      collected.push({
        key: "reference",
        label: "Referencia",
        value: reference,
      });
    }

    const plan = params.get("plan") ?? params.get("plan_id") ?? params.get("preapproval_plan_id");
    if (plan) {
      collected.push({
        key: "plan",
        label: "Plano",
        value: plan,
      });
    }

    return collected;
  }, [params]);

  return {
    params,
    details,
  };
}

