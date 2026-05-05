import { DEFAULT_LIST_LIMIT } from "@/lib/api/limits";
import { getJson } from "@/lib/merchant/auth-client";
import type { MerchantOrderItem, MerchantOrderStatus, MerchantOrdersResponse } from "@/lib/api/merchant-api";
import { normalizeMerchantOrderRow } from "./order-normalize";
import { isAwaitingMerchantStart, rawWorkflowOf, toCanonicalWorkflowToken } from "./order-workflow";

export async function fetchOrdersForStatus(status: MerchantOrderStatus) {
  if (status === "inService") return fetchInServiceOrders();
  const result = await getJson<MerchantOrdersResponse>(
    `/api/merchant/orders?status=${status}&page=1&pageSize=${DEFAULT_LIST_LIMIT}`
  );
  if (!result.ok) return { ok: false as const, message: result.message };
  const orders = result.data.list.map(normalizeMerchantOrderRow);
  return {
    ok: true as const,
    orders: status === "pending" ? orders.filter((order) => !isAwaitingMerchantStart(order)) : orders
  };
}

async function fetchInServiceOrders() {
  const [inServiceResult, pendingResult] = await Promise.all([
    getJson<MerchantOrdersResponse>(`/api/merchant/orders?status=inService&page=1&pageSize=${DEFAULT_LIST_LIMIT}`),
    getJson<MerchantOrdersResponse>(`/api/merchant/orders?status=pending&page=1&pageSize=${DEFAULT_LIST_LIMIT}`)
  ]);
  if (!inServiceResult.ok && !pendingResult.ok) {
    return { ok: false as const, message: inServiceResult.ok ? pendingResult.message : inServiceResult.message };
  }

  const byNo = new Map<string, MerchantOrderItem>();
  const inServiceOrders = inServiceResult.ok ? inServiceResult.data.list.map(normalizeMerchantOrderRow) : [];
  const pendingOrders = pendingResult.ok ? pendingResult.data.list.map(normalizeMerchantOrderRow) : [];
  for (const order of inServiceOrders) byNo.set(order.orderNo, order);
  for (const order of pendingOrders) {
    if (!byNo.has(order.orderNo)) byNo.set(order.orderNo, order);
  }

  const orders = [...byNo.values()].filter((order) => {
    const workflowStatus = toCanonicalWorkflowToken(rawWorkflowOf(order));
    return workflowStatus === "inService" || isAwaitingMerchantStart(order);
  });
  orders.sort((a, b) => Number(isAwaitingMerchantStart(b)) - Number(isAwaitingMerchantStart(a)));
  return { ok: true as const, orders };
}
