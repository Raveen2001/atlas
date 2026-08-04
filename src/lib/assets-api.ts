import { supabase } from "./supabase";
import type { Asset, AssetFormData } from "@/types/assets";

// Supabase numeric columns come back as strings
function parseAsset(row: Record<string, unknown>): Asset {
  return {
    ...(row as unknown as Asset),
    purchase_price: Number(row.purchase_price),
    current_value: row.current_value !== null ? Number(row.current_value) : null,
    sold_price: row.sold_price !== null ? Number(row.sold_price) : null,
  };
}

function toRow(formData: AssetFormData): Record<string, unknown> {
  const isSold = formData.status === "sold";
  return {
    name: formData.name,
    category: formData.category,
    purchase_date: formData.purchase_date,
    purchase_price: formData.purchase_price,
    current_value: formData.current_value,
    warranty_expiry: formData.warranty_expiry,
    serial_number: formData.serial_number || null,
    retailer: formData.retailer || null,
    status: formData.status,
    sold_price: isSold ? formData.sold_price : null,
    sold_date: isSold ? formData.sold_date : null,
    note: formData.note || null,
  };
}

export async function fetchAssets(userId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseAsset);
}

export async function createAsset(
  userId: string,
  formData: AssetFormData,
): Promise<Asset> {
  const { data, error } = await supabase
    .from("assets")
    .insert({ user_id: userId, ...toRow(formData) })
    .select()
    .single();

  if (error) throw error;
  return parseAsset(data);
}

export async function updateAsset(
  assetId: string,
  formData: AssetFormData,
): Promise<void> {
  const { error } = await supabase
    .from("assets")
    .update(toRow(formData))
    .eq("id", assetId);
  if (error) throw error;
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) throw error;
}
