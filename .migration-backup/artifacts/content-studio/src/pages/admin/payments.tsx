import { useState } from "react";
import { useListPaymentGateways, useUpsertPaymentGateway, useTogglePaymentGateway } from "@workspace/api-client-react";
import { getListPaymentGatewaysQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, ToggleLeft, ToggleRight, Plus } from "lucide-react";

const GATEWAYS = [
  { name: "stripe", label: "Stripe", fields: [{ key: "publishable_key", label: "Publishable Key" }, { key: "secret_key", label: "Secret Key (keep private)" }] },
  { name: "paypal", label: "PayPal", fields: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret" }] },
  { name: "flutterwave", label: "Flutterwave", fields: [{ key: "public_key", label: "Public Key" }, { key: "secret_key", label: "Secret Key" }] },
  { name: "paystack", label: "Paystack", fields: [{ key: "public_key", label: "Public Key" }, { key: "secret_key", label: "Secret Key" }] },
];

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});

  const { data: gateways } = useListPaymentGateways({ query: { queryKey: getListPaymentGatewaysQueryKey() } });
  const upsert = useUpsertPaymentGateway();
  const toggle = useTogglePaymentGateway();

  const getConfig = (name: string): Record<string, string> => configs[name] ?? {};
  const setConfig = (name: string, key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } }));
  };

  const handleSave = (name: string) => {
    upsert.mutate({ data: { name, config: JSON.stringify(getConfig(name)) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentGatewaysQueryKey() });
        setActiveGateway(null);
        toast({ title: `${name} gateway saved` });
      },
    });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggle.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentGatewaysQueryKey() });
        toast({ title: isActive ? "Gateway disabled" : "Gateway enabled" });
      },
    });
  };

  const savedGateways = new Map(gateways?.map((g: any) => [g.name, g]) ?? []);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Gateways</h1>
        <p className="text-slate-500 text-sm">Configure and enable payment providers</p>
      </div>

      <div className="space-y-4">
        {GATEWAYS.map((gw) => {
          const saved = savedGateways.get(gw.name) as any;
          const isExpanded = activeGateway === gw.name;

          return (
            <Card key={gw.name} data-testid={`gateway-${gw.name}`} className="border overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{gw.label}</p>
                    <p className="text-xs text-slate-500">{saved ? "Configured" : "Not configured"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saved && (
                    <button onClick={() => handleToggle(saved.id, saved.isActive)} className="text-slate-500 hover:text-slate-700">
                      {saved.isActive
                        ? <ToggleRight className="w-8 h-8 text-green-500" />
                        : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                    </button>
                  )}
                  <Badge className={`text-xs ${saved?.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {saved?.isActive ? "Active" : saved ? "Inactive" : "Not set"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setActiveGateway(isExpanded ? null : gw.name)}>
                    {isExpanded ? "Cancel" : saved ? <><Plus className="w-4 h-4 mr-1" /> Update</> : <><Plus className="w-4 h-4 mr-1" /> Configure</>}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t p-4 bg-slate-50 space-y-3">
                  {gw.fields.map((field) => (
                    <div key={field.key}>
                      <Label className="text-xs mb-1 block">{field.label}</Label>
                      <Input
                        data-testid={`input-${gw.name}-${field.key}`}
                        type="password"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={getConfig(gw.name)[field.key] ?? ""}
                        onChange={(e) => setConfig(gw.name, field.key, e.target.value)}
                      />
                    </div>
                  ))}
                  <Button size="sm" onClick={() => handleSave(gw.name)} disabled={upsert.isPending}>
                    Save {gw.label} Config
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
