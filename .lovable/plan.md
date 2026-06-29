# Site Limousine — style Ride Chic, palette bleu nuit & argent

## Identité visuelle

- **Palette** (bleu nuit & argent) appliquée comme tokens sémantiques dans `src/styles.css` :
  - background `#0a1428`, surface `#142340`, primary `#3b6fa0`, foreground/argent `#c0c8d4`
  - Mode sombre par défaut (le site Ride Chic est sombre)
- **Typographie** : Playfair Display (titres élégants, italique pour accents type "Elegant") + Inter (texte)
- **Ambiance** : hero plein écran avec image de route nocturne / phares, sections sombres, accents argentés, micro-animations subtiles (framer-motion)
- Infos identiques à Ride Chic : nom *Ride Chic*, tel +1 617 483 5676, email info@ridechic.com, réseaux sociaux

## Structure des routes (TanStack Start, fichiers séparés)

```text
/                  Accueil — hero + widget réservation + aperçu services/flotte/témoignages
/about             À propos
/services          Services (aéroport, événements, corporate, mariage, horaire)
/fleet             Flotte (cartes véhicules)
/contact           Contact (formulaire + infos)
/booking           Réservation (3 étapes plein écran)
/auth              Connexion / inscription
/_authenticated/
  my-bookings      Mes réservations utilisateur
  admin            Tableau admin (liste + statuts) — gardé par rôle
```

Chaque route a son propre `head()` (title, description, og).

## Réservation fonctionnelle (Lovable Cloud)

Flow 3 étapes inspiré de Ride Chic :
1. **Détails du trajet** — date, heure, lieu prise en charge, dépose, type (aller simple / aller-retour / horaire), passagers, bagages, heures d'attente
2. **Choix du véhicule** — sélection dans la flotte avec tarif estimé
3. **Commande** — coordonnées passager, notes, confirmation

### Schéma BDD

- `vehicles` (id, name, category, capacity_passengers, capacity_luggage, hourly_rate, base_rate, per_km_rate, image_url, description, active) — lecture publique
- `bookings` (id, user_id nullable, pickup_at, pickup_location, dropoff_location, transfer_type, passengers, luggage, extra_wait_hours, vehicle_id, customer_name, customer_email, customer_phone, notes, estimated_price, status `pending|confirmed|completed|cancelled`, created_at)
- `profiles` (id = auth.uid, full_name, phone)
- `user_roles` (user_id, role enum `admin|user`) + fonction `has_role` SECURITY DEFINER
- RLS : `vehicles` lecture anon ; `bookings` insert ouvert (invités + auth), select/update réservés à propriétaire ou admin ; `user_roles` lecture auth uniquement
- GRANTs explicites dans la même migration

### Server functions (`createServerFn`)

- `listVehicles` (public, lecture via client publishable serveur)
- `createBooking` (public, insert ; lie `user_id` si session)
- `listMyBookings` (`requireSupabaseAuth`)
- `listAllBookings`, `updateBookingStatus` (auth + check `has_role('admin')`)

## Sections de la page d'accueil

1. Header transparent (logo, nav, LOGIN, BOOK NOW)
2. Hero "Your Elegant Ride Awaits" + widget de réservation chevauchant
3. Bandeau services (icônes : Aéroport, Corporate, Événements, Mariage, Horaire)
4. Aperçu flotte (3 cartes véhicules)
5. Pourquoi nous choisir (chauffeurs pros, ponctualité, flotte premium, dispo 24/7)
6. Témoignages
7. CTA "Réservez maintenant"
8. Footer (contact, liens, réseaux sociaux)

## Détails techniques

- **Stack** : TanStack Start existant + TanStack Query (`ensureQueryData` + `useSuspenseQuery`)
- **UI** : composants shadcn (Button, Card, Input, Select, Calendar, Sheet, Sonner)
- **Formulaires** : react-hook-form + zod (validation client + serveur dans `inputValidator`)
- **Auth** : email/password Supabase ; bouton Google différé (à demander si souhaité)
- **Images** : génération via imagegen pour hero (route nocturne) et 3 véhicules (berline, SUV, Sprinter) sauvegardées dans `src/assets/`
- **Tarif estimé** : calcul simple côté serveur `base_rate + per_km_rate*estimated_km + extra_wait_hours*hourly_rate` (km estimé = saisie utilisateur ou valeur défaut, pas d'intégration carte dans cette V1)
- **SEO** : meta uniques par route, h1 unique, alt sur images, JSON-LD `LocalBusiness` sur l'accueil
- **Pas de carte interactive** (Google Maps) dans cette V1 pour rester simple — peut être ajoutée ensuite

## Activations nécessaires

- Lovable Cloud (base + auth + RLS)

Dites-moi si vous voulez ajouter Google sign-in, l'intégration carte/distance réelle, ou un module de paiement (Stripe) — sinon je construis la V1 ci-dessus.
