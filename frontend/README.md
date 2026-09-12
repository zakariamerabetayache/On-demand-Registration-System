# Frontend Application - On-Demand Registration System

The frontend web application for the **On-Demand Registration System** built with **React 18**, **Vite**, and **Tailwind CSS**.

## 🛠️ Tech Stack
- **React** 18.x
- **Vite** 5.x
- **Tailwind CSS** 3.x
- **Axios** (API HTTP Client)
- **Lucide React** (Icons)

## 🚀 Quick Setup Guide

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_BASE_URL=http://localhost:8000`.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access frontend at `http://localhost:5173`.

4. **Production Build**:
   ```bash
   npm run build
   ```

## 📁 Key Components & Structure
- `src/views`: Registration flow, Admin dashboard, Member management, Settings views.
- `src/components`: UI widgets, Modal dialogs, Form step wizards, RTL language toggles.
- `src/axios-client.js`: Centralized Axios instance handling authentication tokens and base API configuration.
- `public/img`: Application graphics, logos, and screenshots (`app-logo.png`, `reg1.PNG`, `reg2.0.PNG`, `reg2.1PNG.PNG`, `reg3.PNG`).
