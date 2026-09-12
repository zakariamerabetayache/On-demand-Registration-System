# Backend API - On-Demand Registration System

The backend component of the **On-Demand Registration System** built with **Laravel 10 REST API**.

## 🛠️ Requirements & Tech Stack
- **PHP** >= 8.1
- **Laravel** 10.x
- **MySQL** 8.x
- **Laravel Sanctum** (Token Authentication)
- **Composer**

## 🚀 Quick Setup Guide

1. **Install Dependencies**:
   ```bash
   composer install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Configure `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `.env`.

3. **Generate App Key**:
   ```bash
   php artisan key:generate
   ```

4. **Database Migrations & Seeders**:
   ```bash
   php artisan migrate --seed
   ```

5. **Storage Link**:
   ```bash
   php artisan storage:link
   ```

6. **Run Server**:
   ```bash
   php artisan serve
   ```
   Access backend at `http://127.0.0.1:8000`.

## 📁 Key Directories
- `app/Http/Controllers/Api`: API Controllers (`PartyMemberController`, `UserController`, `EtablissementController`, `WilayaController`, `CommuneController`).
- `app/Models`: Core Eloquent models (`PartyMember`, `Etablissement`, `Wilaya`, `Commune`, `User`).
- `routes/api.php`: Defined RESTful endpoints.
- `database/migrations`: Database schema definitions.
