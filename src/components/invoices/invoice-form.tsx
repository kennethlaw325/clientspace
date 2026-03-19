"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice, updateInvoice } from "@/lib/actions/invoices";
import type { InvoiceWithRelations, InvoiceItemInput } from "@/lib/actions/invoices";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface InvoiceFormProps {
  clients: ClientOption[];
  projects: ProjectOption[];
  invoice?: InvoiceWithRelations;
}

const emptyItem = (): InvoiceItemInput => ({
  description: "",
  quantity: 1,
  unit_price: 0,
  sort_order: 0,
});

export function InvoiceForm({ clients, projects, invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<InvoiceItemInput[]>(
    invoice?.invoice_items?.length
      ? invoice.invoice_items.map((i) => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          sort_order: i.sort_order,
        }))
      : [emptyItem()]
  );
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate ?? 0);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem(), sort_order: prev.length }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof InvoiceItemInput, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));
    formData.set("tax_rate", String(taxRate));

    startTransition(async () => {
      if (invoice) {
        const result = await updateInvoice(invoice.id, formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Invoice updated");
          router.refresh();
        }
      } else {
        const result = await createInvoice(formData);
        if ("error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Invoice created");
          router.push("/invoices");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!invoice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="client_id">Client *</Label>
            <Select name="client_id" required>
              <SelectTrigger id="client_id">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project_id">Project (optional)</Label>
            <Select name="project_id">
              <SelectTrigger id="project_id">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={invoice?.due_date ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax_rate">Tax Rate (%)</Label>
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Line Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-1" />
          </div>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 px-3 py-2 border-t items-center"
            >
              <div className="col-span-6">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="text-right"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                  className="text-right"
                />
              </div>
              <div className="col-span-1 text-right text-sm font-medium">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 mt-3 text-sm">
          <div className="flex gap-8">
            <span className="text-slate-500">Subtotal</span>
            <span className="w-24 text-right">${subtotal.toFixed(2)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex gap-8">
              <span className="text-slate-500">Tax ({taxRate}%)</span>
              <span className="w-24 text-right">${taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex gap-8 font-bold text-base border-t pt-1 mt-1">
            <span>Total</span>
            <span className="w-24 text-right text-indigo-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Payment terms, bank details, or any other notes..."
          defaultValue={invoice?.notes ?? ""}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
