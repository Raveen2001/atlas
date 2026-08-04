import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Asset,
  AssetCategory,
  AssetFormData,
  AssetStatus,
} from "@/types/assets";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "@/types/assets";

interface AssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSave: (data: AssetFormData) => Promise<void>;
  onDelete?: (assetId: string) => Promise<void>;
}

export function AssetDialog({
  open,
  onOpenChange,
  asset,
  onSave,
  onDelete,
}: AssetDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("gold");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [retailer, setRetailer] = useState("");
  const [status, setStatus] = useState<AssetStatus>("active");
  const [soldPrice, setSoldPrice] = useState("");
  const [soldDate, setSoldDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setPurchaseDate(asset.purchase_date);
      setPurchasePrice(String(asset.purchase_price));
      setCurrentValue(asset.current_value !== null ? String(asset.current_value) : "");
      setWarrantyExpiry(asset.warranty_expiry ?? "");
      setSerialNumber(asset.serial_number ?? "");
      setRetailer(asset.retailer ?? "");
      setStatus(asset.status);
      setSoldPrice(asset.sold_price !== null ? String(asset.sold_price) : "");
      setSoldDate(asset.sold_date ?? "");
      setNote(asset.note ?? "");
    } else {
      setName("");
      setCategory("gold");
      setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
      setPurchasePrice("");
      setCurrentValue("");
      setWarrantyExpiry("");
      setSerialNumber("");
      setRetailer("");
      setStatus("active");
      setSoldPrice("");
      setSoldDate("");
      setNote("");
    }
  }, [asset, open]);

  const priceNum = Number(purchasePrice);
  const canSave =
    name.trim().length > 0 &&
    purchaseDate.length > 0 &&
    purchasePrice.length > 0 &&
    !Number.isNaN(priceNum) &&
    priceNum >= 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        purchase_date: purchaseDate,
        purchase_price: priceNum,
        current_value: currentValue !== "" ? Number(currentValue) : null,
        warranty_expiry: warrantyExpiry || null,
        serial_number: serialNumber.trim(),
        retailer: retailer.trim(),
        status,
        sold_price: soldPrice !== "" ? Number(soldPrice) : null,
        sold_date: soldDate || null,
        note: note.trim(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!asset || !onDelete) return;
    await onDelete(asset.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "New Asset"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., MacBook Pro, Washing Machine..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as AssetCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AssetStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Purchase price (₹)</label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Purchase date</label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          {status === "sold" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sold price (₹)</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sold date</label>
                <Input
                  type="date"
                  value={soldDate}
                  onChange={(e) => setSoldDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current value (₹)</label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Optional"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Warranty till</label>
              <Input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bought from</label>
              <Input
                placeholder="e.g., Amazon, Croma..."
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Serial number</label>
              <Input
                placeholder="Optional"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Optional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {asset && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave || saving} size="sm">
            {saving ? "Saving..." : asset ? "Update" : "Add Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
