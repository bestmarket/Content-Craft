import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coins, Users, Gift, CheckCircle, Clock, ChevronDown, ChevronUp,
  DollarSign, Zap, Edit3, Save, X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const PACKS = [
  { id: "starter", name: "Starter", credits: 100, price: 4.99 },
  { id: "creator", name: "Creator", credits: 500, price: 19.99 },
  { id: "pro", name: "Pro", credits: 1500, price: 49.99 },
  { id: "agency", name: "Agency", credits: 5000, price: 149.99 },
];

export default function AdminCreditsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [editingCosts, setEditingCosts] = useState(false);
  const [costsForm, setCostsForm] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-credits"],
    queryFn: () => api.get("/admin/credits/overview").then(r => r.data),
    refetchInterval: 30000,
  });

  const grantMutation = useMutation({
    mutationFn: (body: any) => api.post("/admin/credits/grant", body).then(r => r.data),
    onSuccess: (d) => {
      toast({ title: "Credits granted!", description: `New balance: ${d.newBalance}` });
      setGrantUserId(""); setGrantAmount(""); setGrantReason("");
      qc.invalidateQueries({ queryKey: ["admin-credits"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: (body: any) => api.post("/admin/credits/confirm-purchase", body).then(r => r.data),
    onSuccess: (d) => {
      toast({ title: "Purchase confirmed!", description: `${d.creditsAdded} credits added. New balance: ${d.newBalance}` });
      qc.invalidateQueries({ queryKey: ["admin-credits"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveCostsMutation = useMutation({
    mutationFn: (costs: any) => api.patch("/admin/credits/costs", { costs }).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Credit costs updated!" });
      setEditingCosts(false);
      qc.invalidateQueries({ queryKey: ["admin-credits"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const costs = data?.costs ?? {};
  const users = data?.users ?? [];
  const pending = data?.pendingPurchases ?? [];

  const totalCredits = users.reduce((s: number, u: any) => s + (u.aiCredits ?? 0), 0);
  const lowUsers = users.filter((u: any) => u.aiCredits < 5 && u.aiCredits !== 999999).length;

  function startEditCosts() {
    setCostsForm({ ...costs });
    setEditingCosts(true);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-violet-500" /> Credit Management
        </h1>
        <p className="text-slate-500 mt-1">Manage AI credits, confirm purchases, and grant credits to users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600" },
          { label: "Total Credits Held", value: totalCredits > 999990 ? "∞" : totalCredits.toLocaleString(), icon: Coins, color: "text-violet-600" },
          { label: "Pending Purchases", value: pending.length, icon: Clock, color: "text-amber-600" },
          { label: "Low Balance Users", value: lowUsers, icon: Zap, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Pending purchases */}
      {pending.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Pending Credit Purchases ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((tx: any) => {
              const packIdMatch = tx.reference?.match(/credit_pack_(\w+)_/);
              const packId = packIdMatch?.[1];
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">User #{tx.userId} — ${tx.amount}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.description}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {PACKS.map(p => (
                      <Button
                        key={p.id}
                        size="sm"
                        variant={packId === p.id ? "default" : "outline"}
                        className={packId === p.id ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        onClick={() => confirmMutation.mutate({ transactionId: tx.id, userId: tx.userId, packId: p.id })}
                        disabled={confirmMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {p.name} ({p.credits} cr)
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Grant credits */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Gift className="h-4 w-4 text-violet-500" /> Grant Credits to User
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">User ID</label>
            <input value={grantUserId} onChange={e => setGrantUserId(e.target.value)} placeholder="e.g. 5"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Credits Amount</label>
            <input value={grantAmount} onChange={e => setGrantAmount(e.target.value)} placeholder="e.g. 100" type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Reason (optional)</label>
            <input value={grantReason} onChange={e => setGrantReason(e.target.value)} placeholder="e.g. bonus, refund"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => grantMutation.mutate({ userId: Number(grantUserId), amount: Number(grantAmount), reason: grantReason })}
              disabled={!grantUserId || !grantAmount || grantMutation.isPending}
            >
              <Gift className="h-4 w-4 mr-1" /> Grant Credits
            </Button>
          </div>
        </div>
      </Card>

      {/* Credit costs editor */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" /> Credit Costs Per Action
          </h2>
          {!editingCosts ? (
            <Button size="sm" variant="outline" onClick={startEditCosts}>
              <Edit3 className="h-3 w-3 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveCostsMutation.mutate(costsForm)} disabled={saveCostsMutation.isPending}>
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingCosts(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(costs).map(([key, val]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{key.replace(/_/g, " ")}</p>
              {editingCosts ? (
                <input
                  type="number" min="0"
                  value={costsForm[key] ?? val}
                  onChange={e => setCostsForm(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 text-xs rounded border border-violet-300 dark:border-violet-600 bg-white dark:bg-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              ) : (
                <Badge variant="outline" className="text-violet-600 border-violet-200 font-bold">{val} cr</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* User balances */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-500" /> All User Balances
        </h2>
        {isLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2">Last Refill</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {users.slice(0, 50).map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="capitalize text-xs">{u.subscriptionTier}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${(u.aiCredits < 5 && u.aiCredits !== 999999) ? "text-red-500" : "text-violet-600 dark:text-violet-400"}`}>
                        {u.aiCredits === 999999 ? "∞" : (u.aiCredits ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-xs">{u.aiCreditsLastRefill ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length > 50 && <p className="text-xs text-slate-400 mt-2">Showing first 50 of {users.length} users.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
