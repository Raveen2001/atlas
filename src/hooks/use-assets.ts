import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/assets-api";
import { computeAssetStats, isInvestmentAsset } from "@/lib/asset-utils";
import type { Asset, AssetFormData } from "@/types/assets";

export function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetchAssets(user.id);
      setAssets(data);
    } catch (e) {
      toast.error("Failed to load assets");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createAsset = useCallback(
    async (formData: AssetFormData) => {
      if (!user) return;
      try {
        await api.createAsset(user.id, formData);
        await fetchAll();
        toast.success("Asset added");
      } catch (e) {
        toast.error("Failed to add asset");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const updateAsset = useCallback(
    async (assetId: string, formData: AssetFormData) => {
      try {
        await api.updateAsset(assetId, formData);
        await fetchAll();
        toast.success("Asset updated");
      } catch (e) {
        toast.error("Failed to update asset");
        console.error(e);
      }
    },
    [fetchAll],
  );

  const deleteAsset = useCallback(async (assetId: string) => {
    try {
      await api.deleteAsset(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset deleted");
    } catch (e) {
      toast.error("Failed to delete asset");
      console.error(e);
    }
  }, []);

  const investments = useMemo(
    () => assets.filter((a) => a.status === "active" && isInvestmentAsset(a)),
    [assets],
  );
  const belongings = useMemo(
    () => assets.filter((a) => a.status === "active" && !isInvestmentAsset(a)),
    [assets],
  );
  const inactive = useMemo(
    () => assets.filter((a) => a.status !== "active"),
    [assets],
  );
  const stats = useMemo(() => computeAssetStats(assets), [assets]);

  return {
    assets,
    investments,
    belongings,
    inactive,
    stats,
    loading,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
