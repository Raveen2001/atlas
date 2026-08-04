import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AssetCard } from "@/components/assets/asset-card";
import { AssetDialog } from "@/components/assets/asset-dialog";
import { AssetStatsGrid } from "@/components/assets/asset-stats";
import { useAssets } from "@/hooks/use-assets";
import { CATEGORY_OPTIONS } from "@/types/assets";
import type { Asset, AssetCategory, AssetFormData } from "@/types/assets";

export function AssetsPage() {
  const {
    assets,
    investments,
    belongings,
    inactive,
    stats,
    loading,
    createAsset,
    updateAsset,
    deleteAsset,
  } = useAssets();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | null>(
    null,
  );

  const usedCategories = useMemo(() => {
    const used = new Set(assets.map((a) => a.category));
    return CATEGORY_OPTIONS.filter((opt) => used.has(opt.value));
  }, [assets]);

  const matches = (asset: Asset) => {
    if (categoryFilter && asset.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        (asset.retailer ?? "").toLowerCase().includes(q) ||
        (asset.note ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  };

  const filteredInvestments = investments.filter(matches);
  const filteredBelongings = belongings.filter(matches);
  const filteredInactive = inactive.filter(matches);
  const hasAny = assets.length > 0;
  const noneMatch =
    filteredInvestments.length === 0 &&
    filteredBelongings.length === 0 &&
    filteredInactive.length === 0;

  const handleSave = async (data: AssetFormData) => {
    if (editingAsset) {
      await updateAsset(editingAsset.id, data);
    } else {
      await createAsset(data);
    }
  };

  const openCreate = () => {
    setEditingAsset(null);
    setDialogOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Asset
          </Button>
        </div>

        {hasAny && (
          <>
            <AssetStatsGrid stats={stats} />

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {usedCategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="All"
                    active={categoryFilter === null}
                    onClick={() => setCategoryFilter(null)}
                  />
                  {usedCategories.map((opt) => (
                    <FilterChip
                      key={opt.value}
                      label={opt.label}
                      active={categoryFilter === opt.value}
                      onClick={() =>
                        setCategoryFilter(
                          categoryFilter === opt.value ? null : opt.value,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {filteredInvestments.length > 0 && (
          <AssetSection title="Investments" assets={filteredInvestments} onEdit={openEdit} />
        )}

        {filteredBelongings.length > 0 && (
          <AssetSection title="Other Assets" assets={filteredBelongings} onEdit={openEdit} />
        )}

        {filteredInactive.length > 0 && (
          <AssetSection title="Sold / Disposed" assets={filteredInactive} onEdit={openEdit} />
        )}

        {hasAny && noneMatch && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No assets match your search.
          </p>
        )}

        {!hasAny && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No assets yet. Track your offline investments — land, gold,
              silver — and everything else you own.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Add your first asset
            </Button>
          </div>
        )}
      </div>

      <AssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={editingAsset}
        onSave={handleSave}
        onDelete={editingAsset ? deleteAsset : undefined}
      />
    </>
  );
}

function AssetSection({
  title,
  assets,
  onEdit,
}: {
  title: string;
  assets: Asset[];
  onEdit: (asset: Asset) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-2">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onEdit={() => onEdit(asset)} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      <Badge
        variant={active ? "default" : "outline"}
        className="cursor-pointer"
      >
        {label}
      </Badge>
    </button>
  );
}
