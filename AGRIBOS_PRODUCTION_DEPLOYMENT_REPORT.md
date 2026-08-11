# AGRIBOS — PRODUCTION CLOUD DEPLOYMENT REPORT

**Project**: AgriBOS — Agricultural Business Operating System  
**Organization**: SRI BASAVESHWARA & CO.  
**Proprietor**: Doddana Gowda  
**Location**: Alabanur / Sindhanur  
**Repository**: `https://github.com/diwakarreddy706-maker/AgriBOS.git`  
**Target Platform**: Render Cloud (Web Service + Static Site + Persistent Disk)

---

## 1. Production Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │      RENDER CLOUD PLATFORM              │
                                  │                                         │
┌────────────────────────┐        │  ┌───────────────────────────────────┐  │
│                        │ HTTPS  │  │  agribos-frontend                 │  │
│  Browser / Client UI   ├────────┼─►│  Static Site (React + Vite)       │  │
│  (Desktop / Mobile)    │        │  └─────────────────┬─────────────────┘  │
│                        │        │                    │                    │
└───────────┬────────────┘        │                    │ REST API Calls     │
            │                     │                    ▼ over HTTPS         │
            │                     │  ┌───────────────────────────────────┐  │
            │                     │  │  agribos-backend                  │  │
            └─────────────────────┼─►│  Node.js + Express Web Service    │  │
             API / Health Checks  │  └─────────────────┬─────────────────┘  │
                                  │                    │                    │
                                  │                    │ Mount Volume       │
                                  │                    ▼ /var/data          │
                                  │  ┌───────────────────────────────────┐  │
                                  │  │  agribos-sqlite-disk              │  │
                                  │  │  1GB Persistent Mounted Disk      │  │
                                  │  │  Path: /var/data/agribos.db       │  │
                                  │  └───────────────────────────────────┘  │
                                  └─────────────────────────────────────────┘
```

---

## 2. Deployed URLs & Health Check Specifications

| Service | Target URL | Protocol | Health Endpoint |
| :--- | :--- | :---: | :--- |
| **Backend API** | `https://agribos-backend.onrender.com` | `HTTPS` | `GET https://agribos-backend.onrender.com/api/v1/health` |
| **Frontend UI** | `https://agribos-frontend.onrender.com` | `HTTPS` | `GET https://agribos-frontend.onrender.com/` |

---

## 3. Persistent Database & Backup Strategy

### Persistent Disk Mounting Configuration
- **Mount Path**: `/var/data`
- **Database File**: `/var/data/agribos.db`
- **Environment Variable**: `DB_PATH=/var/data/agribos.db`
- **Data Safety Assurance**: All SQLite tables, constraints, foreign keys, and indexes are preserved across application restarts, container redeployments, and server reboots. Zero mock/demo data is seeded into production.

### Backup Strategy
Before every production update, execute a point-in-time backup:
```bash
cp ./agribos-backend/data/agribos.db ./agribos-backend/data/agribos_backup_$(date +%Y%m%d_%H%M%S).db
```
Verify integrity using SQLite PRAGMA checks:
```sql
PRAGMA integrity_check;
PRAGMA foreign_keys;
```
Expected output:
- `integrity_check` $\rightarrow$ `ok`
- `foreign_keys` $\rightarrow$ `1`

---

## 4. Production Environment Variables Summary

### Backend (`agribos-backend`) Environment Variables

| Variable Name | Production Setting | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | Set automatically by Render | Internal service port |
| `DB_PATH` | `/var/data/agribos.db` | Persistent disk storage location |
| `JWT_SECRET` | Render Auto-Generated Secret | 256-bit secure token signing secret |
| `FRONTEND_URL` | `https://agribos-frontend.onrender.com` | Restricted CORS origin URL |

### Frontend (`agribos-frontend`) Environment Variables

| Variable Name | Production Setting | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://agribos-backend.onrender.com/api/v1` | Production backend API entry point |

---

## 5. Security & Isolation Matrix

- **HTTPS Strict Enforcer**: All connections enforced over TLS/HTTPS.
- **JWT & Role-Based Access Control (RBAC)**: All sensitive routes (`/machines`, `/bookings`, `/farmers`, `/finance`, `/settlement-ledger`) protected by JWT tokens and role verification.
- **CORS Restriction**: Restricted to the frontend domain (`FRONTEND_URL`).
- **Category Isolation**: Strict runtime validation preventing assignment or work entry leakage between **Tractor Fleet** and **Combine Harvester Fleet**.

---

## 6. Render Dashboard Step-by-Step Deployment Instructions

If deploying via Render Blueprint (`render.yaml`):
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ Select **Blueprint**.
3. Connect repository `diwakarreddy706-maker/AgriBOS`.
4. Render will automatically detect `render.yaml` and provision both:
   - `agribos-backend` (Node.js Web Service + Persistent Disk)
   - `agribos-frontend` (Static Site with SPA rewrite rules)
5. Click **Apply**.

---

## 7. Rollback Procedure

If a production rollback is needed:
1. In Render Dashboard, navigate to `agribos-backend` $\rightarrow$ **Deploys** $\rightarrow$ Click **Rollback** to previous working commit.
2. In Render Dashboard, navigate to `agribos-frontend` $\rightarrow$ **Deploys** $\rightarrow$ Click **Rollback** to previous working commit.
3. If database restoration is required, restore the latest backup file to `/var/data/agribos.db`.
