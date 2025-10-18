# RENTAURAS X - Documentation Technique
## Version Accélérée - Livraison en 1 Mois

---

## 📐 Architecture Simplifiée

### 1. Stack Technologique Optimisée

```
┌──────────────────────────────────────────────────────────────┐
│                    COUCHE PRÉSENTATION                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │ Application  │    │ Application  │    │  Dashboard   │    │
│  │  Passager    │    │  Chauffeur   │    │    Admin     │    │
│  │              │    │              │    │              │    │
│  │React Native  │    │React Native  │    │   Next.js    │    │
│  │(Expo GO)     │    │(Expo GO)     │    │   (SSR)      │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │            │
│         │        HTTPS/TLS (REST + WebSocket)   │            │
│         │                   │                   │            │
└─────────┼───────────────────┼───────────────────┼────────────┘
          │                   │                   │
          │                   │                   │
┌─────────┼───────────────────┼───────────────────┼────────────┐
│         │                   │                   │            │
│  ┏━━━━━━▼━━━━━━━━━━━━━━━━━━━▼━━━━━━━━━━━━━━━━━━▼━━━━━━━┓     │
│  ┃              BACKEND MONOLITHIQUE                   ┃     │
│  ┃                                                     ┃     │
│  ┃  Node.js + Express.js                               ┃     │
│  ┃                                                     ┃     │
│  ┃  Modules internes:                                  ┃     │
│  ┃  • Auth & Users                                     ┃     │
│  ┃  • Rides Management                                 ┃     │
│  ┃  • Payments                                         ┃     │
│  ┃  • Notifications (Socket.io)                        ┃     │
│  ┃  • Locations & Tracking                             ┃     │
│  ┃  • Admin Operations                                 ┃     │
│  ┃                                                     ┃     │
│  ┃  Port: 3000                                         ┃     │
│  ┗━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     │
│                         │                                    │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                  COUCHE DONNÉES                              │
├─────────────────────────┼────────────────────────────────────┤
│                         │                                    │
│              ┌──────────▼──────────┐                          │
│              │                     │                          │
│              │   SUPABASE          │                          │
│              │                     │                          │
│              │  • PostgreSQL       │                          │
│              │  • Auth             │                          │
│              │  • Realtime         │                          │
│              │  • Storage          │                          │
│              │  • Edge Functions   │                          │
│              │                     │                          │
│              └─────────────────────┘                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               SERVICES EXTERNES                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  • Google Maps API (Cartes, Géolocalisation, Directions)     │
│  • Twilio (SMS & WhatsApp OTP)                               │
│  • Firebase Cloud Messaging (Notifications Push)             │
│  • Stripe/CMI Gateway (Paiements)                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Changements Majeurs pour Accélération

### Simplifications Architecturales

**Avant (Architecture Microservices):**
- 6+ microservices indépendants
- Multiple bases de données (MongoDB + PostgreSQL + Redis)
- Service Discovery complexe
- Déploiement multi-conteneurs

**Après (Architecture Monolithique Modulaire):**
- ✅ Un seul backend Express.js
- ✅ Une seule base de données (Supabase PostgreSQL)
- ✅ Modules organisés par fonctionnalité
- ✅ Déploiement simplifié (single container)

### Technologies Changées

| Composant | Avant | Après | Raison |
|-----------|-------|-------|--------|
| **Mobile Apps** | React Native (Bare) | React Native (Expo GO) | Développement 3x plus rapide |
| **Dashboard** | React + Vite | Next.js | SSR + API routes intégrées |
| **Backend** | Microservices | Monolithe Express.js | Simplicité, rapidité |
| **Base de données** | MongoDB + PostgreSQL + Redis | Supabase (PostgreSQL) | BaaS tout-en-un |
| **Auth** | Custom JWT + Redis | Supabase Auth | Auth prêt à l'emploi |
| **Realtime** | Socket.io + Redis Pub/Sub | Supabase Realtime | Infrastructure gérée |
| **Storage** | AWS S3 | Supabase Storage | Intégration native |
| **Maps** | Mapbox | Google Maps/OpenStreetMap | APIs plus simples |

---

## 🔄 Diagrammes de Séquence Simplifiés

### 2.1 Réservation de Course

```
Passager App          Backend API         Supabase DB      Google Maps API
    │                      │                  │                  │
    │  1. POST /rides      │                  │                  │
    │  + Auth Token        │                  │                  │
    ├─────────────────────>│                  │                  │
    │                      │                  │                  │
    │                      │ 2. Verify token  │                  │
    │                      ├─────────────────>│                  │
    │                      │                  │                  │
    │                      │ 3. User data     │                  │
    │                      │<─────────────────┤                  │
    │                      │                  │                  │
    │                      │ 4. Get route     │                  │
    │                      ├─────────────────────────────────────>│
    │                      │                  │                  │
    │                      │ 5. Route + distance + duration       │
    │                      │<─────────────────────────────────────┤
    │                      │                  │                  │
    │                      │ 6. Query nearby  │                  │
    │                      │    drivers       │                  │
    │                      ├─────────────────>│                  │
    │                      │                  │                  │
    │                      │ 7. Drivers list  │                  │
    │                      │<─────────────────┤                  │
    │                      │                  │                  │
    │                      │ 8. Create ride   │                  │
    │                      ├─────────────────>│                  │
    │                      │                  │                  │
    │                      │ 9. Ride created  │                  │
    │                      │<─────────────────┤                  │
    │                      │                  │                  │
    │                      │ 10. Realtime     │                  │
    │                      │     broadcast    │                  │
    │                      ├─────────────────>│                  │
    │                      │    (to drivers)  │                  │
    │                      │                  │                  │
    │  11. 201 Created     │                  │                  │
    │  + Ride details      │                  │                  │
    │<─────────────────────┤                  │                  │
    │                      │                  │                  │
```

### 2.2 Authentification OTP WhatsApp

```
App Mobile          Backend API       Supabase Auth      Twilio API
    │                   │                │                │
    │ 1. POST           │                │                │
    │ /auth/send-otp    │                │                │
    │ {phone}           │                │                │
    ├──────────────────>│                │                │
    │                   │                │                │
    │                   │ 2. Generate    │                │
    │                   │    OTP (4)     │                │
    │                   │                │                │
    │                   │ 3. Store OTP   │                │
    │                   │    (10 min)    │                │
    │                   ├───────────────>│                │
    │                   │                │                │
    │                   │ 4. Send via    │                │
    │                   │    WhatsApp    │                │
    │                   ├───────────────────────────────>│
    │                   │                │                │
    │  5. 200 OK        │                │                │
    │<──────────────────┤                │                │
    │                   │                │                │
    │ 6. POST           │                │                │
    │ /auth/verify-otp  │                │                │
    │ {phone, otp}      │                │                │
    ├──────────────────>│                │                │
    │                   │                │                │
    │                   │ 7. Verify OTP  │                │
    │                   ├───────────────>│                │
    │                   │                │                │
    │                   │ 8. Valid +     │                │
    │                   │    JWT tokens  │                │
    │                   │<───────────────┤                │
    │                   │                │                │
    │  9. 200 OK        │                │                │
    │  {accessToken,    │                │                │
    │   refreshToken,   │                │                │
    │   user}           │                │                │
    │<──────────────────┤                │                │
    │                   │                │                │
```

### 2.3 Paiement Course (Simplifié)

```
App Passager      Backend API      Stripe/CMI        Supabase DB
    │                  │               │                  │
    │ 1. POST          │               │                  │
    │ /payments        │               │                  │
    │ {rideId,         │               │                  │
    │  method,         │               │                  │
    │  amount}         │               │                  │
    ├─────────────────>│               │                  │
    │                  │               │                  │
    │                  │ 2. Create     │                  │
    │                  │    payment    │                  │
    │                  │    intent     │                  │
    │                  ├──────────────>│                  │
    │                  │               │                  │
    │                  │ 3. Client     │                  │
    │                  │    secret     │                  │
    │                  │<──────────────┤                  │
    │                  │               │                  │
    │  4. 200 OK       │               │                  │
    │  {clientSecret}  │               │                  │
    │<─────────────────┤               │                  │
    │                  │               │                  │
    │ 5. Confirm       │               │                  │
    │    payment       │               │                  │
    ├────────────────────────────────>│                  │
    │                  │               │                  │
    │ 6. Success       │               │                  │
    │<────────────────────────────────┤                  │
    │                  │               │                  │
    │                  │ 7. Webhook    │                  │
    │                  │<──────────────┤                  │
    │                  │               │                  │
    │                  │ 8. Update     │                  │
    │                  │    ride &     │                  │
    │                  │    payment    │                  │
    │                  ├──────────────────────────────────>│
    │                  │               │                  │
    │ 9. Push notif    │               │                  │
    │ "Paiement OK"    │               │                  │
    │<─────────────────┤               │                  │
    │                  │               │                  │
```

---

## 🗄️ Schéma de Base de Données (Supabase PostgreSQL)

```sql
-- Users (Passagers & Chauffeurs)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  photo_url TEXT,
  role VARCHAR(20) DEFAULT 'passenger', -- 'passenger' | 'driver' | 'admin'
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'suspended' | 'pending'
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver Profiles
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_category VARCHAR(50), -- 'classic' | 'comfort' | 'express' | 'women'
  vehicle_model VARCHAR(100),
  vehicle_plate VARCHAR(20),
  license_number VARCHAR(50),
  documents JSONB, -- CIN, permis, carte grise, assurance URLs
  validation_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rating DECIMAL(3,2) DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rides
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  pickup_location GEOGRAPHY(POINT) NOT NULL,
  pickup_address TEXT,
  dropoff_location GEOGRAPHY(POINT) NOT NULL,
  dropoff_address TEXT,
  category VARCHAR(50), -- 'classic' | 'comfort' | 'express' | 'women'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  price_type VARCHAR(20), -- 'fixed' | 'auction'
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  distance_km DECIMAL(10,2),
  duration_min INTEGER,
  scheduled_at TIMESTAMP,
  is_recurring BOOLEAN DEFAULT false,
  sharing_enabled BOOLEAN DEFAULT false,
  payment_method VARCHAR(20), -- 'cash' | 'card' | 'wallet'
  payment_status VARCHAR(20), -- 'pending' | 'completed' | 'refunded'
  passenger_rating INTEGER,
  driver_rating INTEGER,
  co2_saved_kg DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Ride Bids (for auction system)
CREATE TABLE ride_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id),
  bid_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES rides(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  payment_method VARCHAR(20),
  payment_provider VARCHAR(50), -- 'stripe' | 'cmi' | 'cash'
  transaction_id VARCHAR(255),
  status VARCHAR(20), -- 'pending' | 'completed' | 'failed' | 'refunded'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20), -- 'credit' | 'debit' | 'commission' | 'rental_fee'
  amount DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  description TEXT,
  reference_id UUID, -- ride_id or payment_id
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50), -- 'ride_request' | 'ride_accepted' | 'payment' | 'system'
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings & Configuration
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_drivers_online ON driver_profiles(is_online) WHERE is_online = true;
CREATE INDEX idx_drivers_location ON driver_profiles USING GIST(current_location);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_created ON rides(created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
```

---

## 🌐 API Routes (Backend Express.js)

### Structure des Routes

```javascript
// Auth Routes
POST   /api/auth/send-otp         // Envoyer OTP
POST   /api/auth/verify-otp       // Vérifier OTP + Login
POST   /api/auth/refresh           // Rafraîchir token
POST   /api/auth/logout            // Déconnexion

// User Routes
GET    /api/users/me               // Profil utilisateur
PUT    /api/users/me               // Mettre à jour profil
GET    /api/users/:id              // Détails utilisateur
POST   /api/users/upload-photo     // Upload photo

// Driver Routes
POST   /api/drivers/register       // Inscription chauffeur
PUT    /api/drivers/documents      // Upload documents
GET    /api/drivers/me             // Profil chauffeur
PUT    /api/drivers/status         // Online/Offline
PUT    /api/drivers/location       // Mise à jour position
GET    /api/drivers/earnings       // Revenus chauffeur

// Ride Routes
POST   /api/rides                  // Créer course
GET    /api/rides/:id              // Détails course
GET    /api/rides/active           // Courses actives
GET    /api/rides/history          // Historique courses
PUT    /api/rides/:id/accept       // Accepter course (chauffeur)
PUT    /api/rides/:id/start        // Démarrer course
PUT    /api/rides/:id/complete     // Terminer course
PUT    /api/rides/:id/cancel       // Annuler course
POST   /api/rides/:id/rate         // Noter course
GET    /api/rides/nearby-drivers   // Chauffeurs à proximité

// Bid Routes (Enchères)
POST   /api/bids                   // Placer enchère
GET    /api/bids/ride/:rideId      // Enchères pour une course
PUT    /api/bids/:id/accept        // Accepter enchère

// Payment Routes
POST   /api/payments/create        // Créer paiement
POST   /api/payments/webhook       // Webhook paiement
GET    /api/payments/history       // Historique paiements

// Wallet Routes
GET    /api/wallet/balance         // Solde wallet
POST   /api/wallet/recharge        // Recharger wallet
POST   /api/wallet/withdraw        // Retrait wallet
GET    /api/wallet/transactions    // Historique transactions

// Notification Routes
GET    /api/notifications          // Liste notifications
PUT    /api/notifications/:id/read // Marquer lu
DELETE /api/notifications/:id      // Supprimer notification

// Admin Routes
GET    /api/admin/drivers/pending  // Chauffeurs en attente
PUT    /api/admin/drivers/:id/approve   // Approuver chauffeur
PUT    /api/admin/drivers/:id/reject    // Rejeter chauffeur
GET    /api/admin/rides/active     // Courses actives (toutes)
GET    /api/admin/analytics        // Statistiques globales
PUT    /api/admin/settings         // Paramètres plateforme

// Map & Location Routes
GET    /api/maps/directions        // Itinéraire (Google Maps)
GET    /api/maps/geocode           // Géocodage adresse
GET    /api/maps/reverse-geocode   // Géocodage inverse
GET    /api/maps/estimate-price    // Estimation prix

// WebSocket Events (Socket.io)
// Passenger events
ride:created                       // Course créée
ride:accepted                      // Course acceptée
ride:driver_location               // Position chauffeur
ride:started                       // Course démarrée
ride:completed                     // Course terminée

// Driver events
ride:new_request                   // Nouvelle demande
ride:cancelled                     // Course annulée
bid:new                            // Nouvelle enchère
bid:accepted                       // Enchère acceptée
```

---

## 💻 Structure des Projets

### Backend (Express.js)

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js           // Supabase client
│   │   ├── env.js                // Variables d'environnement
│   │   └── constants.js          // Constantes
│   ├── middleware/
│   │   ├── auth.js               // Vérification JWT
│   │   ├── validation.js         // Validation des données
│   │   └── errorHandler.js       // Gestion erreurs
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── driver.routes.js
│   │   ├── ride.routes.js
│   │   ├── payment.routes.js
│   │   ├── wallet.routes.js
│   │   ├── notification.routes.js
│   │   ├── admin.routes.js
│   │   └── map.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── driver.controller.js
│   │   ├── ride.controller.js
│   │   ├── payment.controller.js
│   │   ├── wallet.controller.js
│   │   ├── notification.controller.js
│   │   ├── admin.controller.js
│   │   └── map.controller.js
│   ├── services/
│   │   ├── otp.service.js        // Service OTP (Twilio)
│   │   ├── payment.service.js    // Stripe/CMI
│   │   ├── notification.service.js // FCM
│   │   ├── maps.service.js       // Google Maps
│   │   └── analytics.service.js  // Statistiques
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── logger.js
│   ├── socket/
│   │   └── index.js              // Socket.io handlers
│   └── app.js                    // Express app setup
├── .env.example
├── package.json
└── README.md
```

### Mobile Apps (React Native + Expo)

```
mobile-passenger/  (ou mobile-driver/)
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneInputScreen.js
│   │   │   ├── OTPVerificationScreen.js
│   │   │   └── CompleteProfileScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js
│   │   │   └── MapScreen.js
│   │   ├── ride/
│   │   │   ├── RideRequestScreen.js
│   │   │   ├── RideTrackingScreen.js
│   │   │   └── RideHistoryScreen.js
│   │   ├── payment/
│   │   │   ├── PaymentScreen.js
│   │   │   └── WalletScreen.js
│   │   └── profile/
│   │       ├── ProfileScreen.js
│   │       └── SettingsScreen.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   └── Card.js
│   │   ├── map/
│   │   │   ├── MapView.js
│   │   │   └── DriverMarker.js
│   │   └── ride/
│   │       ├── RideCard.js
│   │       └── DriverInfo.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   └── AuthNavigator.js
│   ├── services/
│   │   ├── api.js                // Axios instance
│   │   ├── socket.js             // Socket.io client
│   │   ├── location.js           // Expo Location
│   │   └── notifications.js      // Expo Notifications
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── rideSlice.js
│   │   │   └── userSlice.js
│   │   └── store.js              // Redux store
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useLocation.js
│   │   └── useSocket.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validators.js
│   └── App.js
├── app.json
├── package.json
└── README.md
```

### Dashboard Admin (Next.js)

```
dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.js
│   │   ├── (dashboard)/
│   │   │   ├── layout.js
│   │   │   ├── page.js           // Dashboard principal
│   │   │   ├── drivers/
│   │   │   │   ├── page.js       // Liste chauffeurs
│   │   │   │   ├── pending/
│   │   │   │   │   └── page.js   // En attente validation
│   │   │   │   └── [id]/
│   │   │   │       └── page.js   // Détails chauffeur
│   │   │   ├── rides/
│   │   │   │   ├── page.js       // Liste courses
│   │   │   │   ├── active/
│   │   │   │   │   └── page.js   // Courses actives
│   │   │   │   └── [id]/
│   │   │   │       └── page.js   // Détails course
│   │   │   ├── payments/
│   │   │   │   └── page.js       // Paiements
│   │   │   ├── analytics/
│   │   │   │   └── page.js       // Statistiques
│   │   │   └── settings/
│   │   │       └── page.js       // Paramètres
│   │   ├── api/
│   │   │   └── [...route]/       // API routes Next.js
│   │   │       └── route.js
│   │   └── layout.js
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Sidebar.js
│   │   │   ├── Header.js
│   │   │   └── StatsCard.js
│   │   ├── drivers/
│   │   │   ├── DriverCard.js
│   │   │   ├── DriverTable.js
│   │   │   └── ValidationModal.js
│   │   ├── rides/
│   │   │   ├── RideTable.js
│   │   │   └── RideMap.js
│   │   └── charts/
│   │       ├── LineChart.js
│   │       └── BarChart.js
│   ├── lib/
│   │   ├── supabase.js           // Client Supabase
│   │   ├── api.js                // API calls
│   │   └── utils.js
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── package.json
└── README.md
```

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