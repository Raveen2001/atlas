import {
  LandPlot,
  Coins,
  CircleDollarSign,
  Gem,
  Smartphone,
  Refrigerator,
  Armchair,
  Car,
  Dumbbell,
  CookingPot,
  Package,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Store,
} from "lucide-react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatAmount,
  formatGain,
  getAssetGain,
  getGainColor,
  getWarrantyInfo,
  isInvestmentAsset,
} from "@/lib/asset-utils";
import type { Asset, AssetCategory } from "@/types/assets";

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  land: LandPlot,
  gold: Coins,
  silver: CircleDollarSign,
  jewellery: Gem,
  electronics: Smartphone,
  appliance: Refrigerator,
  furniture: Armchair,
  vehicle: Car,
  fitness: Dumbbell,
  kitchen: CookingPot,
  other: Package,
};

const WARRANTY_STYLES = {
  active: { icon: ShieldCheck, className: "text-green-600" },
  expiring: { icon: ShieldAlert, className: "text-amber-600" },
  expired: { icon: ShieldX, className: "text-muted-foreground" },
} as const;

interface AssetCardProps {
  asset: Asset;
  onEdit: () => void;
}

export function AssetCard({ asset, onEdit }: AssetCardProps) {
  const Icon = CATEGORY_ICONS[asset.category] ?? Package;
  const warranty = getWarrantyInfo(asset);
  const gain = getAssetGain(asset);
  const isInvestment = isInvestmentAsset(asset);

  // Investments lead with what it's worth now; belongings with what was paid
  const primaryAmount =
    isInvestment && asset.status === "active"
      ? (asset.current_value ?? asset.purchase_price)
      : asset.purchase_price;

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-opacity ${
        asset.status !== "active" ? "opacity-60" : ""
      }`}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{asset.name}</p>
            {asset.status === "sold" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Sold
              </Badge>
            )}
            {asset.status === "disposed" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Disposed
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(asset.purchase_date + "T00:00:00"), "MMM d, yyyy")}
            </span>
            {asset.retailer && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Store className="h-3 w-3" />
                {asset.retailer}
              </span>
            )}
            {warranty && (
              <span
                className={`flex items-center gap-1 text-xs ${WARRANTY_STYLES[warranty.state].className}`}
              >
                {(() => {
                  const WIcon = WARRANTY_STYLES[warranty.state].icon;
                  return <WIcon className="h-3 w-3" />;
                })()}
                {warranty.label}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold font-mono">
            {formatAmount(primaryAmount)}
          </p>
          {gain !== null && (
            <p className={`text-xs font-mono ${getGainColor(gain.amount)}`}>
              {formatGain(gain.amount)} ({gain.pct >= 0 ? "+" : ""}
              {gain.pct.toFixed(1)}%)
            </p>
          )}
          {gain === null &&
            !isInvestment &&
            asset.current_value !== null &&
            asset.status === "active" && (
              <p className="text-xs text-muted-foreground font-mono">
                now {formatAmount(asset.current_value)}
              </p>
            )}
        </div>
      </div>
    </Card>
  );
}
