## 📐 Architecture Technique

### Vue d'Ensemble de l'Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │ Application  │    │ Application  │    │  Dashboard   │    │
│  │  Passager    │    │  Chauffeur   │    │    Admin     │    │
│  │              │    │              │    │              │    │
│  │ React Native │    │ React Native │    │   Next.js    │    │
│  │  (iOS/And.)  │    │  (iOS/And.)  │    │              │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │            │
│         └───────────────────┴───────────────────┘            │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                   HTTPS/TLS (REST + WebSocket)
                              │
┌─────────────────────────────┼────────────────────────────────┐
│                             │                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━▼━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│  ┃              BACKEND API (Express.js)                ┃    │
│  ┃                                                      ┃    │
│  ┃  • Routage unifié des requêtes                       ┃    │
│  ┃  • Authentification via Supabase Auth                ┃    │
│  ┃  • Logique métier centralisée                        ┃    │
│  ┃  • WebSocket pour temps réel (Socket.io)             ┃    │
│  ┃  • Intégration APIs externes                         ┃    │
│  ┃                                                      ┃    │
│  ┃  Port: 3000 (développement) / 443 (production)       ┃    │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │                       │                       │
├──────────────┼───────────────────────┼───────────────────────┤
│         COUCHE DONNÉES & SERVICES    │                       │
├──────────────┼───────────────────────┼───────────────────────┤
│              │                       │                       │
│    ┌─────────▼────────┐    ┌─────────▼────────┐              │
│    │    SUPABASE      │    │ Redis (optionnel)│              │
│    │                  │    │                  │              │
│    │ • PostgreSQL DB  │    │ • Cache sessions │              │
│    │ • Authentication │    │ • Pub/Sub temps  │              │
│    │ • Realtime       │    │   réel           │              │
│    │ • Storage        │    │                  │              │
│    │ • Row Level Sec. │    │ Port: 6379       │              │
│    │                  │    │                  │              │
│    └──────────────────┘    └──────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SERVICES EXTERNES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Google Maps API / OpenStreetMap (Cartes & Géoloc.)       │
│  • Twilio (SMS & WhatsApp OTP)                              │
│  • Firebase Cloud Messaging (Notifications Push)            │
│  • CMI Gateway (Paiements bancaires)                        │
│  • SendGrid / Amazon SES (Emails)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Communication entre les Couches

**Frontend ↔ Backend API :**
- Protocole : HTTPS/TLS
- Format : JSON (REST API)
- WebSocket pour temps réel (Socket.io)
- Authentification : JWT via Supabase Auth

**Backend ↔ Supabase :**
- SDK Supabase JS/Node.js
- Row Level Security (RLS) pour sécurité
- Realtime subscriptions pour mises à jour live
- Storage pour documents (permis, photos, etc.)

**Backend ↔ APIs Externes :**
- REST API pour Google Maps/OpenStreetMap
- Webhooks pour CMI Gateway
- API Twilio pour OTP
- FCM pour notifications

---

## 🔄 Diagrammes de Séquence

### Authentification OTP WhatsApp

```
App Mobile          Express API        Supabase Auth       Twilio API
    │                    │                   │                 │
    │ POST /auth/send-otp│                   │                 │
    │ {phone}            │                   │                 │
    ├───────────────────>│                   │                 │
    │                    │                   │                 │
    │                    │ Générer OTP       │                 │
    │                    │ (6 digits)        │                 │
    │                    │                   │                 │
    │                    │ Stocker dans      │                 │
    │                    │ Supabase          │                 │
    │                    ├──────────────────>│                 │
    │                    │                   │                 │
    │                    │ Envoyer SMS/      │                 │
    │                    │ WhatsApp          │                 │
    │                    ├───────────────────┼────────────────>│
    │                    │                   │                 │
    │ 200 OK             │                   │                 │
    │<───────────────────┤                   │                 │
    │                    │                   │                 │
    │ POST /auth/verify  │                   │                 │
    │ {phone, otp}       │                   │                 │
    ├───────────────────>│                   │                 │
    │                    │                   │                 │
    │                    │ Vérifier OTP      │                 │
    │                    ├──────────────────>│                 │
    │                    │                   │                 │
    │                    │ Créer/Get User    │                 │
    │                    │ + JWT Token       │                 │
    │                    │<──────────────────┤                 │
    │                    │                   │                 │
    │ 200 OK             │                   │                 │
    │ {token, user}      │                   │                 │
    │<───────────────────┤                   │                 │
```

### Réservation de Course

```
App Passager        Express API         Supabase DB      Google Maps API
    │                    │                   │                 │
    │ POST /rides/create │                   │                 │
    │ {pickup, dropoff}  │                   │                 │
    ├───────────────────>│                   │                 │
    │                    │                   │                 │
    │                    │ Calculer route    │                 │
    │                    │ & distance        │                 │
    │                    ├───────────────────┼────────────────>│
    │                    │                   │                 │
    │                    │ Distance, durée   │                 │
    │                    │<──────────────────┴─────────────────┤
    │                    │                   │                 │
    │                    │ Calculer prix     │                 │
    │                    │ Estimer CO2       │                 │
    │                    │                   │                 │
    │                    │ Insérer ride      │                 │
    │                    ├──────────────────>│                 │
    │                    │                   │                 │
    │                    │ ride_id           │                 │
    │                    │<──────────────────┤                 │
    │                    │                   │                 │
    │                    │ Notifier          │                 │
    │                    │ chauffeurs        │                 │
    │                    │ (Socket.io)       │                 │
    │                    │                   │                 │
    │ 201 Created        │                   │                 │
    │ {ride details}     │                   │                 │
    │<───────────────────┤                   │                 │
```

### Acceptation de Course par Chauffeur

```
App Chauffeur       Express API         Supabase DB      Socket.io
    │                    │                   │              │
    │ POST /rides/accept │                   │              │
    │ {ride_id}          │                   │              │
    ├───────────────────>│                   │              │
    │                    │                   │              │
    │                    │ UPDATE ride       │              │
    │                    │ SET driver_id     │              │
    │                    │ SET status        │              │
    │                    ├──────────────────>│              │
    │                    │                   │              │
    │                    │ Notifier passager │              │
    │                    ├───────────────────┼─────────────>│
    │                    │                   │              │
    │ 200 OK             │                   │              │
    │<───────────────────┤                   │              │
```

### Paiement de Course

```
App Passager        Express API        CMI Gateway       Supabase DB
    │                    │                   │                 │
    │ POST /payments     │                   │                 │
    │ {ride_id, method}  │                   │                 │
    ├───────────────────>│                   │                 │
    │                    │                   │                 │
    │                    │ Créer transaction │                 │
    │                    ├───────────────────┼────────────────>│
    │                    │                   │                 │
    │                    │ Initier paiement  │                 │
    │                    ├──────────────────>│                 │
    │                    │                   │                 │
    │                    │ Payment URL       │                 │
    │                    │<──────────────────┤                 │
    │                    │                   │                 │
    │ 200 OK             │                   │                 │
    │ {payment_url}      │                   │                 │
    │<───────────────────┤                   │                 │
    │                    │                   │                 │
    │ Redirect CMI       │                   │                 │
    ├────────────────────┼──────────────────>│                 │
    │                    │                   │                 │
    │                    │ Webhook callback  │                 │
    │                    │<──────────────────┤                 │
    │                    │                   │                 │
    │                    │ Update transaction│                 │
    │                    │ Update ride       │                 │
    │                    ├───────────────────┼────────────────>│
    │                    │                   │                 │
    │ Push notification  │                   │                 │
    │ "Paiement OK"      │                   │                 │
    │<───────────────────┤                   │                 │
```

---

## 📱 Applications Frontend

### Application Passager (React Native)

#### Screens Principales
- **Auth** : Login, OTP Verification
- **Home** : Carte, sélection pickup/dropoff
- **Ride Booking** : Choix catégorie, estimation prix
- **Ride Tracking** : Suivi temps réel
- **Payment** : Choix méthode paiement
- **History** : Historique courses
- **Profile** : Paramètres, paiements enregistrés
- **Wallet** : Gestion portefeuille

#### Librairies Clés
- **Navigation** : React Navigation
- **Cartes** : Google Maps
- **Temps réel** : Socket.io-client
- **State Management** : React Query + Context API
- **HTTP Client** : Axios
- **Notifications** : @react-native-firebase/messaging
- **Paiements** : Intégration CMI

### Application Chauffeur (React Native)

#### Screens Principales
- **Auth** : Login, Registration
- **Document Upload** : Upload permis, CIN, etc.
- **Dashboard** : Statut, gains du jour
- **Ride Requests** : Notifications courses
- **Active Ride** : Navigation, statut course
- **Earnings** : Historique revenus
- **Wallet** : Solde, recharges, retraits
- **Profile** : Infos véhicule, documents

### Dashboard Admin (Next.js)

#### Pages Principales
- **/dashboard** : Vue d'ensemble
- **/drivers** : Gestion chauffeurs
- **/rides** : Courses en temps réel
- **/payments** : Transactions
- **/analytics** : Graphiques et stats
- **/settings** : Configuration plateforme

---

## 🔐 Sécurité

### Authentification
- **OTP Multi-canaux** : SMS, WhatsApp, Email
- **JWT Tokens** : Access + Refresh tokens
- **Row Level Security** : Sécurité au niveau base de données
- **Session Management** : Gestion via Supabase

### Sécurité des Données
- **Chiffrement** : TLS 1.3 en transit
- **Validation** : Input validation systématique
- **Rate Limiting** : Protection contre abus
- **CORS** : Configuration stricte

### Sécurité Métier
- **Validation Chauffeurs** : Vérification manuelle documents
- **Bouton SOS** : Alerte urgence
- **Partage Trajet** : Envoi localisation temps réel
- **Audit Logs** : Traçabilité actions admin

---

## 🚀 Déploiement

### Backend (Express.js)
- **Hébergement** : Vercel

### Frontend Mobile
- **iOS** : App Store
- **Android** : Google Play Store

### Dashboard Admin
- **Hébergement** : Vercel

---

## 📊 Monitoring & Maintenance

### Outils Recommandés
- **Logs** : Supabase Dashboard + Sentry
- **Performance** : Google Analytics, Mixpanel
- **Uptime** : UptimeRobot
- **Errors** : Sentry pour backend et apps

### Backups
- **Database** : Backups automatiques Supabase
- **Documents** : Supabase Storage avec réplication

---

## 🎯 Plan de Livraison (1 Mois)

### Semaine 1 : Foundation
- Setup projets (React Native + Next.js + Express)
- Configuration Supabase (schéma DB + Auth)
- Intégration Google Maps/OpenStreetMap
- Authentication flow complet

### Semaine 2 : Core Features
- Module réservation courses (passager)
- Module acceptation courses (chauffeur)
- Tracking temps réel (Socket.io)
- Système d'enchères basique

### Semaine 3 : Advanced Features
- Paiements (CMI + Wallet)
- Notifications push
- Dashboard admin (CRUD complet)
- Rating system

### Semaine 4 : Polish & Deploy
- Tests end-to-end
- UI/UX refinement
- Déploiement production
- Documentation technique

---

## 📦 Livrables Finaux

### Code Source
- ✅ Repositories Git complets
- ✅ Applications React Native (iOS + Android)
- ✅ Dashboard Next.js
- ✅ Backend Express.js
- ✅ Documentation technique complète

### Configuration
- ✅ Fichiers .env.example
- ✅ Scripts de déploiement
- ✅ Guide d'installation
- ✅ Schéma Supabase (migrations)

### Documentation
- ✅ README détaillés
- ✅ Documentation API (Swagger)
- ✅ Guide utilisateur admin
- ✅ Guide de maintenance

---