import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllBookings, updateBookingStatus, type BookingStatus } from "@/lib/bookings";
import { useSeo } from "@/lib/useSeo";

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
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-silver-bright">All reservations</h1>

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
        </div>
      </main>
      <Footer />
    </>
  );
}
