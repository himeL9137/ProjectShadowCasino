import { queryClient } from "@/lib/queryClient";

export function getQueryBalance(): number {
  const data = queryClient.getQueryData(["/api/wallet/balance"]) as any;
  return parseFloat(data?.balance || "0");
}

export function applyOptimisticBalance(newBalance: number, currency: string) {
  const rounded = Math.max(0, newBalance);
  queryClient.setQueryData(["/api/wallet/balance"], (old: any) => ({
    ...(old || {}),
    balance: rounded.toFixed(2),
    currency,
  }));
  window.dispatchEvent(
    new CustomEvent("balance_update", {
      detail: { balance: rounded.toFixed(2), currency },
    })
  );
}

export function applyOptimisticDebit(betAmount: number, currency: string) {
  const current = getQueryBalance();
  applyOptimisticBalance(current - betAmount, currency);
}

export function applyServerBalance(serverBalance: string | undefined, currency: string) {
  if (serverBalance === undefined) {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    return;
  }
  applyOptimisticBalance(parseFloat(serverBalance), currency);
}
