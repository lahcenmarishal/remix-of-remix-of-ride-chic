import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllBookings, updateBookingStatus, type BookingStatus } from "@/lib/bookings";
import { listAllVehiclesAdmin, createVehicle, updateVehicle, deleteVehicle, type AdminVehicle, type VehicleInput } from "@/lib/vehicles";
import { useSeo } from "@/lib/useSeo";

const emptyVehicle: VehicleInput = {
  name: "",
  category: "Sedan",
  description: "",
  capacity_passengers: 4,
  capacity_luggage: 2,
  base_rate: 0,
  per_km_rate: 0,
  hourly_rate: 0,
  sort_order: 0,
  active: true,
};

export default function Admin() {
  useSeo({ title: "Admin — Ride Chic", description: "Manage all reservations.", noindex: true });
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["all-bookings"], queryFn: listAllBookings });
  const mutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Admin</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-silver-bright">Dashboard</h1>

          <Tabs defaultValue="bookings" className="mt-10">
            <TabsList>
              <TabsTrigger value="bookings">Reservations</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-6">
          {error ? (
            <Card className="mt-10 p-8 bg-card/60 text-destructive">
              {(error as Error).message}
            </Card>
          ) : isLoading ? (
            <p className="mt-10 text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-10 space-y-3">
              {data.map((b) => (
                <Card key={b.id} className="p-5 bg-card/60 grid md:grid-cols-[1fr_auto_auto] items-center gap-4">
                  <div>
                    <p className="text-silver-bright font-medium">{b.customer_name} · {b.customer_email}</p>
                    <p className="text-sm text-muted-foreground">{b.pickup_location} → {b.dropoff_location}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(b.pickup_at), "PPP p")}</p>
                  </div>
                  <span className="font-display text-xl text-silver-bright">${Number(b.estimated_price).toFixed(0)}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{b.status}</Badge>
                    <Select value={b.status} onValueChange={(v) => mutation.mutate({ id: b.id, status: v as BookingStatus })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">No reservations yet.</p>}
            </div>
          )}
            </TabsContent>

            <TabsContent value="fleet" className="mt-6">
              <FleetManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FleetManager() {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-vehicles"], queryFn: listAllVehiclesAdmin });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(emptyVehicle);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const createMut = useMutation({
    mutationFn: () => createVehicle(form),
    onSuccess: () => { toast.success("Vehicle added"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: () => updateVehicle(editing!.id, form),
    onSuccess: () => { toast.success("Vehicle updated"); invalidate(); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => { toast.success("Vehicle deleted"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(emptyVehicle); setOpen(true); };
  const openEdit = (v: AdminVehicle) => {
    setEditing(v);
    setForm({
      name: v.name,
      category: v.category,
      description: v.description ?? "",
      capacity_passengers: v.capacity_passengers,
      capacity_luggage: v.capacity_luggage,
      base_rate: Number(v.base_rate),
      per_km_rate: Number(v.per_km_rate),
      hourly_rate: Number(v.hourly_rate),
      sort_order: v.sort_order,
      active: v.active,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate(); else createMut.mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-silver-bright">Fleet</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90"><Plus className="size-4 mr-2" /> Add vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Limo">Limo</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Passengers</Label>
                  <Input type="number" min={1} value={form.capacity_passengers} onChange={(e) => setForm({ ...form, capacity_passengers: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Luggage</Label>
                  <Input type="number" min={0} value={form.capacity_luggage} onChange={(e) => setForm({ ...form, capacity_luggage: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Base rate ($)</Label>
                  <Input type="number" step="0.01" value={form.base_rate} onChange={(e) => setForm({ ...form, base_rate: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Per km ($)</Label>
                  <Input type="number" step="0.01" value={form.per_km_rate} onChange={(e) => setForm({ ...form, per_km_rate: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Hourly ($)</Label>
                  <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-primary hover:bg-primary/90">
                  {editing ? "Save changes" : "Add vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <Card className="mt-6 p-8 bg-card/60 text-destructive">{(error as Error).message}</Card>
      ) : isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {data.map((v) => (
            <Card key={v.id} className="p-5 bg-card/60 grid md:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
              <div>
                <p className="text-silver-bright font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {v.capacity_passengers} pax · {v.capacity_luggage} bags</p>
                {v.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{v.description}</p>}
              </div>
              <span className="text-sm text-silver">base ${Number(v.base_rate).toFixed(0)} · /km ${Number(v.per_km_rate).toFixed(2)} · /h ${Number(v.hourly_rate).toFixed(0)}</span>
              <Badge variant={v.active ? "default" : "outline"}>{v.active ? "Active" : "Hidden"}</Badge>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)} aria-label="Edit"><Pencil className="size-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {v.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone. Existing bookings keep their reference.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMut.mutate(v.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
          {data.length === 0 && <p className="text-muted-foreground">No vehicles yet.</p>}
        </div>
      )}
    </div>
  );
}
