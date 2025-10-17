# CAHIER DES CHARGES - RENTAURAS X

## Présentation générale

### Projet RENTAURAS X
**Plateforme de Covoiturage Hybride & Électrique au Maroc**

**Nom du projet :** RENTAURAS X

**Objet :** Développement d'une plateforme de covoiturage moderne, inspirée des standards internationaux (Uber, Bolt, Indrive), mais adaptée au marché marocain, mettant en avant des véhicules électriques et hybrides.

**Vision :** Offrir une solution de mobilité durable, sûre et innovante.

### Cibles

**Passagers :** usagers recherchant une alternative fiable, écologique et abordable.

**Chauffeurs :** professionnels ou indépendants équipés de véhicules EV/Hybride, validés par la plateforme.

### Différenciation

- Mise en avant des véhicules propres
- Système d'enchères et de flexibilité des prix
- Paiements adaptés au Maroc (cash, CMI, mobile money)
- Fonctions avancées : OTP multi-canaux, ride-sharing, multiple ride acceptance

---

## 2. Application Passager (RENTAURAS X – User App)

### 2.1 Inscription & Authentification

- Création de compte par : numéro de téléphone, OTP WhatsApp, email OTP, ou réseaux sociaux
- Vérification obligatoire avant première réservation
- Profil simple : photo, nom, moyens de paiement enregistrés

### 2.2 Réservation de course

**Choix de la catégorie de véhicule :**
- Classic EV/Hybrid (solution économique)
- Comfort EV/Hybrid (premium)
- Express EV (micro-voitures rapides, ex. Citroën Ami)
- Option Women-to-Women (chauffeuse pour passagères)

**Modes de réservation :**
- Immédiate
- Programmée (planification future)
- Récurrente (trajets domicile-travail)

**Estimations avancées :**
- Prix et durée du trajet
- Économie de CO₂ affichée
- Possibilité de comparer les prix et temps entre catégories

### 2.3 Paiement

- Cash (paiement direct au chauffeur)
- Carte bancaire (Visa, Mastercard, CMI)
- Mobile Money (Inwi Money, Orange Money, MarocPay)
- Wallet interne (rechargement et utilisation)

### 2.4 Suivi du trajet

- Localisation chauffeur en temps réel
- ETA dynamique ajusté selon trafic
- Partage du trajet avec des proches
- Notifications push (confirmation, arrivée, course terminée)

### 2.5 Interaction & Feedback

- Chat in-app et appel masqué
- Notation chauffeur (étoiles, avis)

---

## 3. Application Chauffeur (RENTAURAS X – Driver App)

### 3.1 Onboarding & Vérification

- Création de profil chauffeur avec envoi de documents : CIN, permis, carte grise, assurance
- Validation manuelle par l'admin avant activation

### 3.2 Gestion des courses

**Réception des notifications de trajets**

**Modes de fonctionnement :**
- Acceptation directe (comme Uber)
- Système d'enchères (le passager propose un prix, les chauffeurs répondent)
- Multiple ride acceptance : possibilité d'accepter plusieurs passagers partageant un itinéraire similaire (type UberPool)

**Autres fonctionnalités :**
- Navigation intégrée
- Suivi et historique des courses

### 3.3 Wallet & Paiement

- Rechargement du wallet (via cash point, carte ou mobile money)
- Déductions automatiques :
  - Commission de la plateforme (cash ou digital)
  - Frais de location de véhicule (si applicable)
- Historique détaillé des revenus (cash et wallet)
- Possibilité de retrait via banque ou Wafacash

### 3.4 Sécurité & Support

- Bouton SOS intégré
- Assistance en ligne disponible
- Blocage automatique si wallet insuffisant

---

## 4. Back-office (RENTAURAS X – Admin Panel)

### 4.1 Gestion des chauffeurs

- Validation manuelle des inscriptions
- Gestion des catégories (Classic, Comfort, Express)
- Suivi des documents et statuts

### 4.2 Gestion des trajets

- Visualisation en temps réel des courses
- Ajustement dynamique des tarifs (surge pricing)
- Supervision des enchères et du multi-passagers

### 4.3 Paiements & Finances

- Suivi des commissions perçues
- Suivi des recharges et retraits chauffeurs
- Suivi des frais de location

### 4.4 Analytics & Reporting

- Nombre de trajets, revenus, chauffeurs/passagers actifs
- Répartition par catégories (Classic, Comfort, Express)
- Statistiques Women-to-Women
- Indicateurs environnementaux (CO₂ économisé)

---

## 5. Fonctionnalités Avancées & Différenciatrices

- OTP via WhatsApp, SMS ou Email (sécurité renforcée)
- Système d'enchères (flexibilité de prix)
- Multiple ride acceptance (chauffeur peut gérer plusieurs passagers sur un trajet)
- Ride-sharing (covoiturage multiple)
- Réservations récurrentes
- Comptes corporate (entreprises)
- Suivi bornes de recharge EV
- Gamification : points, badges, primes écologiques