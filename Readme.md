# OZi Backend — Node.js + Express + TypeScript + Sequelize (MySQL)

A production-ready REST API starter for authentication and order placement. Built with **Express**, **TypeScript**, and **Sequelize** (MySQL). Includes JWT auth, version gating, structured responses, security middlewares, and rate limiting.

---

## ✨ Features
- **Auth**: Register, Login, Refresh token, Get profile
- **Orders**: Place order, Get order by id, Get orders for logged-in user
- **JWT** access & refresh tokens with expiry configuration
- **Version check** on login (useful for mobile apps)
- **Security**: `helmet`, `cors`, **rate limiting**
- **Consistent responses** via a centralized `ResponseHandler`
- **Auto DB sync**: uses `sequelize.sync()` (no migrations in this repo)
- **TypeScript** with `ts-node` + Nodemon for DX
- Code formatting with **Prettier**

---

## 🧱 Tech Stack
- Node.js, Express
- TypeScript, ts-node, Nodemon
- Sequelize ORM (MySQL) with `mysql2`
- JWT, bcrypt
- Helmet, CORS, express‑rate‑limit
- Prettier

---

## 📁 Project Structure
```
OZi-Backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── orderController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── responseHandler.ts
│   │   └── versionCheck.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── Order.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── orderRoutes.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── jwt.ts
│       └── validation.ts
├── .env
├── package.json
├── tsconfig.json
├── nodemon.json
└── (dist/ after build)
```

---

## ✅ Prerequisites
- **Node.js** 18+ (LTS recommended)
- **MySQL** 8.x (local or Docker)
- **npm** 9+ or **pnpm/yarn**

---

## ⚙️ Environment Variables
Create a **.env** in project root (this repo already includes a sample). **Never commit secrets.**

```env
PORT=3000
NODE_ENV=development
MIN_APP_VERSION=2.5.0

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=auth_module
DB_USER=root
DB_PASSWORD=

JWT_ACCESS_SECRET=replace_with_secure_random_string
JWT_REFRESH_SECRET=replace_with_secure_random_string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

> **MIN_APP_VERSION** is enforced only when `source: app` header is sent to the **/login** endpoint.

---

## 🗄️ Database Setup

### Option A: Local MySQL
1. Install MySQL and start the server.
2. Create the database:
   ```sql
   CREATE DATABASE auth_module CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. (Optional) Create a dedicated user:
   ```sql
   CREATE USER 'ozidev'@'%' IDENTIFIED BY 'strong_password_here';
   GRANT ALL PRIVILEGES ON auth_module.* TO 'ozidev'@'%';
   FLUSH PRIVILEGES;
   ```
4. Update `.env` accordingly.

### Option B: Docker
```bash
docker run --name mysql-ozibackend -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass \
  -e MYSQL_DATABASE=auth_module -d mysql:8.0
```

> Tables are created automatically on server start via `sequelize.sync({ force: false })` in `src/config/database.ts`.

---

## 📦 Install & Run

```bash
# 1) Install deps
npm install

# 2) Start in dev mode (ts-node + nodemon)
npm run dev

# 3) Or build & run
npm run build
npm start
```

You should see:
```
Database connection established successfully.
Database synchronized successfully.
Server is running on port 3000
Environment: development
```

Health check:
```
GET http://localhost:3000/health
```

---

## 🔌 API

Base path: `http://localhost:3000/api`

### Auth
- **POST** `/auth/register`
  - Body:
    ```json
    { "email": "user@example.com", "password": "Passw0rd!" }
    ```
  - 200 response:
    ```json
    { "statusCode": 200, "success": true, "data": { "id": 1, "email": "user@example.com" }, "error": null }
    ```

- **POST** `/auth/login` *(version-gated)*
  - **Headers (optional but recommended for mobile apps):**
    - `source: app` → turn on version gating
    - `app-version: 2.5.0` (must be `>= MIN_APP_VERSION` from `.env` when `source: app`)
  - Body:
    ```json
    { "email": "user@example.com", "password": "Passw0rd!" }
    ```
  - 200 response:
    ```json
    { "statusCode": 200, "success": true, "data": { "accessToken": "...", "refreshToken": "..." }, "error": null }
    ```

- **POST** `/auth/refresh-token`
  - Body:
    ```json
    { "refreshToken": "..." }
    ```
  - 200 response:
    ```json
    { "statusCode": 200, "success": true, "data": { "accessToken": "...", "refreshToken": "..." }, "error": null }
    ```

- **GET** `/auth/profile` *(protected)*
  - Headers: `Authorization: Bearer <accessToken>`
  - 200 response: user profile

### Orders *(all protected)*
All order routes require `Authorization: Bearer <accessToken>`

- **POST** `/orders/place`
  - Sample body (minimal):
    ```json
    {
      "cart": [
        { "sku": "ABC-123", "amount": 100 }
      ],
      "order_amount": 100,
      "order_type": "delivery",
      "payment_method": "cod",
      "store_id": 1,
      "address": "221B Baker Street",
      "contact_person_number": "9876543210"
    }
    ```
  - Response: created order

- **GET** `/orders/:id` → get one order by id
- **GET** `/orders` → list orders of the authenticated user

> **Common gotcha:** routes are mounted under `/api/...`. For example, place an order at `POST /api/orders/place` (not `/orders/place`).

---

## 🧩 Request Examples (cURL)

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email":"test@example.com", "password":"Passw0rd!" }'
```

**Login (with version headers)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "source: app" \
  -H "app-version: 2.5.0" \
  -d '{ "email":"test@example.com", "password":"Passw0rd!" }'
```

**Get Profile**
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Place Order**
```bash
curl -X POST http://localhost:3000/api/orders/place \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "cart":[{"sku":"ABC-123","amount":100}],
    "order_amount":100,
    "order_type":"delivery",
    "payment_method":"cod",
    "store_id":1,
    "address":"221B Baker Street",
    "contact_person_number":"9876543210"
  }'
```

---

## 🗃️ Database Schema (created by `sequelize.sync()`)

### `Users` (Sequelize default table name for `User`)
| column     | type        | constraints                     |
|------------|-------------|---------------------------------|
| id         | INTEGER     | PK, auto-increment              |
| email      | STRING      | unique, not null, email format  |
| password   | STRING      | not null (bcrypt hashed)        |
| createdAt  | DATE        | default NOW, not null           |
| updatedAt  | DATE        | default NOW, not null           |

### `orders`
| column                 | type           | constraints/notes                                  |
|------------------------|----------------|-----------------------------------------------------|
| id                     | INTEGER        | PK, auto-increment                                  |
| user_id                | INTEGER        | FK → Users.id, not null                             |
| cart                   | JSON           | not null                                            |
| coupon_discount_amount | DECIMAL(10,2)  | default 0                                           |
| order_amount           | DECIMAL(10,2)  | not null                                            |
| order_type             | STRING(20)     | e.g., `delivery` / `pickup`                         |
| payment_method         | STRING(20)     | e.g., `cod`, `card`, `upi`                          |
| store_id               | INTEGER        | not null                                            |
| distance               | DECIMAL(10,2)  | optional                                            |
| discount_amount        | DECIMAL(10,2)  | optional                                            |
| tax_amount             | DECIMAL(10,2)  | optional                                            |
| address                | STRING(255)    | not null                                            |
| latitude               | DECIMAL(10,6)  | optional                                            |
| longitude              | DECIMAL(10,6)  | optional                                            |
| contact_person_name    | STRING(100)    | optional                                            |
| contact_person_number  | STRING(20)     | not null                                            |
| address_type           | STRING(20)     | optional                                            |
| is_scheduled           | TINYINT        | default 0                                           |
| scheduled_timestamp    | BIGINT         | optional (epoch seconds)                            |
| promised_delv_tat      | STRING(10)     | default `24`, not null                              |
| created_at             | BIGINT         | not null (epoch seconds)                            |
| updated_at             | BIGINT         | not null (epoch seconds)                            |

Indexes on `orders`: `user_id`, `store_id`, `created_at`.

> **Note:** `orders` uses custom timestamp fields (`created_at`/`updated_at`) and sets `timestamps: false` in the model.

---

## 🔐 Auth Flow (JWT)
- On **/auth/login**, you receive `accessToken` and `refreshToken`.
- Send `Authorization: Bearer <accessToken>` on protected routes.
- When access token expires, call **/auth/refresh-token** with the current refresh token to get a new pair.
- Secrets and expirations are controlled via `.env`.

---

## 🛡️ Middlewares
- `helmet`, `cors`, `express-rate-limit`
- `versionCheck` → validates `app-version` when header `source: app` is present
- `authenticate` → validates JWT and loads user into `req.user`
- `errorHandler` → central error to response mapper
- `ResponseHandler` → unifies success/error JSON shape

---

## 🧰 Scripts
```jsonc
"scripts": {{
  "dev": "nodemon",
  "build": "tsc",
  "start": "node dist/server.js",
  "format": "prettier --write ."
}}
```

---

## 🧪 Validation
See `src/utils/validation.ts` for simple email/password validation rules. Passwords must be at least 8 chars and include lower, upper, and numeric characters.

---

## 🧩 Troubleshooting
- **Cannot POST /orders/place** → Use the correct base path: `POST /api/orders/place`.
- **Invalid or expired token** → Ensure you’re sending `Authorization: Bearer <ACCESS_TOKEN>`; check `.env` secrets match the ones used to sign the token.
- **Version check failed** on login → If you send `source: app`, also send `app-version` and make sure it’s `>= MIN_APP_VERSION`.
- **DB connect error** → Verify MySQL is running and `.env` DB settings are correct. Try `mysql -h 127.0.0.1 -P 3306 -u root -p`.
- **Port already in use** → Change `PORT` in `.env`.

---

## 📄 License
Private/internal. Add a license if you plan to open source.

---

## 🙌 Notes
- This project uses `sequelize.sync()` for convenience. For production, consider Sequelize **migrations** for safer schema evolution.
- Keep your `.env` out of Git (`.gitignore` is already configured).
