import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, MapPin, ArrowRight, Phone, Route as RouteIcon, Timer, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeRoute } from "@/lib/maps";

type LatLng = { lat: number; lng: number };
type GMaps = typeof globalThis & { google?: any; __rideChicMapInit?: () => void; __rideChicMapReady?: boolean };

const GMAPS_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const GMAPS_CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

function loadGoogleMaps(): Promise<any> {
  const w = window as GMaps;
  if (w.google?.maps) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gmaps-sdk") as HTMLScriptElement | null;
    const finish = () => resolve((window as GMaps).google);
    if (existing) {
      if ((window as GMaps).__rideChicMapReady) return finish();
      existing.addEventListener("load", () => setTimeout(finish, 50));
      return;
    }
    (window as GMaps).__rideChicMapInit = () => {
      (window as GMaps).__rideChicMapReady = true;
      finish();
    };
    const s = document.createElement("script");
    s.id = "gmaps-sdk";
    s.async = true;
    s.defer = true;
    const params = new URLSearchParams({
      key: GMAPS_KEY ?? "",
      v: "weekly",
      libraries: "places,geometry,marker",
      loading: "async",
      callback: "__rideChicMapInit",
    });
    if (GMAPS_CHANNEL) params.set("channel", GMAPS_CHANNEL);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function PlacePicker({ id, placeholder, value, onChange, onPlace }: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onPlace: (p: { address: string; location: LatLng }) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !wrapRef.current) return;
    let cancelled = false;
    let listener: any;
    loadGoogleMaps().then(async (google) => {
      if (cancelled || !wrapRef.current) return;
      await google.maps.importLibrary("places");
      const el = document.createElement("gmp-place-autocomplete") as any;
      el.setAttribute("placeholder", placeholder);
      el.style.width = "100%";
      wrapRef.current.innerHTML = "";
      wrapRef.current.appendChild(el);
      elRef.current = el;
      listener = async (ev: any) => {
        const place = ev.placePrediction?.toPlace?.() ?? ev.place;
        if (!place) return;
        await place.fetchFields({ fields: ["formattedAddress", "location", "displayName"] });
        const loc = place.location;
        const address = place.formattedAddress ?? place.displayName ?? "";
        onChange(address);
        if (loc) onPlace({ address, location: { lat: loc.lat(), lng: loc.lng() } });
      };
      el.addEventListener("gmp-select", listener);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (elRef.current && listener) elRef.current.removeEventListener("gmp-select", listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted || !GMAPS_KEY) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" id={id} />
      </div>
    );
  }
  return (
    <div className="relative rounded-md border border-input bg-background overflow-hidden [&_gmp-place-autocomplete]:block [&_gmp-place-autocomplete]:w-full">
      <div ref={wrapRef} className="px-3 py-1.5 min-h-10 flex items-center" />
    </div>
  );
}

export function BookingWidget() {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupLoc, setPickupLoc] = useState<LatLng | null>(null);
  const [dropoffLoc, setDropoffLoc] = useState<LatLng | null>(null);
  const [transferType, setTransferType] = useState<"one_way" | "round_trip" | "hourly">("one_way");
  const [extraWait, setExtraWait] = useState(0);

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polyRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);



  useEffect(() => { setMounted(true); }, []);

  // init map
  useEffect(() => {
    if (!mounted || !mapDivRef.current || !GMAPS_KEY) return;
    let cancelled = false;
    loadGoogleMaps().then(async (google) => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      await google.maps.importLibrary("maps");
      mapRef.current = new google.maps.Map(mapDivRef.current, {
        center: { lat: 48.8566, lng: 2.3522 },
        zoom: 11,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1d2535" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0a1428" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#a8b3c7" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3650" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1a30" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [mounted]);

  // compute route when both ends known
  useEffect(() => {
    if (!pickupLoc || !dropoffLoc) return;
    let aborted = false;
    (async () => {
      try {
        const res = await computeRoute({ origin: pickupLoc, destination: dropoffLoc });
        if (aborted) return;
        setDistanceKm(Math.round((res.distanceMeters / 1000) * 10) / 10);
        setDurationMin(Math.round(res.durationSeconds / 60));
        const google = (window as GMaps).google;
        const map = mapRef.current;
        if (!google || !map) return;
        // clear
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (polyRef.current) polyRef.current.setMap(null);
        const path = res.polyline ? decodePolyline(res.polyline) : [pickupLoc, dropoffLoc];
        polyRef.current = new google.maps.Polyline({
          path,
          map,
          strokeColor: "#c0c8d4",
          strokeWeight: 4,
          strokeOpacity: 0.9,
        });
        const m1 = new google.maps.Marker({ position: pickupLoc, map, label: "A" });
        const m2 = new google.maps.Marker({ position: dropoffLoc, map, label: "B" });
        markersRef.current = [m1, m2];
        const bounds = new google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 60);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { aborted = true; };
  }, [pickupLoc, dropoffLoc]);

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (pickupDate) params.set("date", pickupDate);
    if (pickupTime) params.set("time", pickupTime);
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    params.set("type", transferType);
    if (distanceKm != null) params.set("km", String(distanceKm));
    if (extraWait) params.set("wait", String(extraWait));
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 md:p-8 shadow-[var(--shadow-elegant)] text-left">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* FORM */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display text-2xl text-silver-bright">Reserve your ride</h3>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-silver">Pickup date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-silver">Pickup time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
              <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-silver">Pickup location</Label>
            <PlacePicker
              id="pickup"
              placeholder="Address, hotel or airport"
              value={pickup}
              onChange={setPickup}
              onPlace={(p) => { setPickup(p.address); setPickupLoc(p.location); }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-silver">Drop-off location</Label>
            <PlacePicker
              id="dropoff"
              placeholder="Destination"
              value={dropoff}
              onChange={setDropoff}
              onPlace={(p) => { setDropoff(p.address); setDropoffLoc(p.location); }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Transfer type</Label>
              <Select value={transferType} onValueChange={(v) => setTransferType(v as typeof transferType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_way">One way</SelectItem>
                  <SelectItem value="round_trip">Round trip</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-silver">Extra waiting (h)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
                <Input type="number" min={0} max={24} step={0.5} value={extraWait} onChange={(e) => setExtraWait(Number(e.target.value))} className="pl-9" />
              </div>
            </div>
          </div>

          <Button onClick={handleContinue} size="lg" className="w-full bg-primary hover:bg-primary/90 tracking-wider">
            Search <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>

        {/* MAP */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] lg:aspect-auto lg:h-[420px]">
            {GMAPS_KEY ? (
              <div ref={mapDivRef} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
                Map unavailable
              </div>
            )}
          </div>

          {/* SUMMARY PANEL */}
          <div className="rounded-xl border border-border bg-background/60 p-4 grid grid-cols-3 gap-2 items-center">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/15 grid place-items-center">
                <RouteIcon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
                <p className="font-display text-lg text-silver-bright leading-tight">
                  {distanceKm !== null ? `${distanceKm} km` : "—"}
                </p>
              </div>
            </div>

            <a href="tel:+10000000000" className="justify-self-center">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground tracking-wider">
                <Phone className="size-4 mr-2" /> Call us
              </Button>
            </a>

            <div className="flex items-center gap-3 justify-self-end">
              <div className="size-10 rounded-full bg-primary/15 grid place-items-center">
                <Timer className="size-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total time</p>
                <p className="font-display text-lg text-silver-bright leading-tight">
                  {durationMin !== null
                    ? durationMin >= 60
                      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                      : `${durationMin} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          {(pickupLoc && dropoffLoc) && (
            <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <Car className="size-3.5 text-primary" /> Route auto-calculated. Final price confirmed at booking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
