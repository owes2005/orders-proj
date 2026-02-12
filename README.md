
# 🚚 Logistics Management Dashboard

---

## 🌐 Live Demo

🔗 **Live Application:**
👉 [https://ordersproj.netlify.app/](https://ordersproj.netlify.app/)

---

## 📌 Overview

A modern **Angular 21** logistics management system featuring:

* 📍 Real-time delivery tracking on map
* 📋 Live delivery control panel
* 📊 Advanced customizable analytics dashboard
* 💾 Persistent chart configuration
* 🧠 Clean architecture using Angular Standalone Components

The application separates:

* **Operational Data (Today’s Orders Only)**
* **Historical Analytics (All Orders Data)**

Just like real-world logistics platforms.

---

## 🚀 Features

### 📍 Live Map Tracking

* Displays only **today’s active deliveries**
* GPS simulation
* Auto-follow selected order
* Dynamic marker updates
* Status-based marker styling

---

### 📋 Orders Control Panel

* Shows only **today’s orders**
* Live selection sync with map
* Operational dashboard view

---

### 📊 Custom Analytics

Create fully dynamic charts:

**Chart Types**

* Bar
* Line
* Pie
* Doughnut

**Dimensions (X-Axis)**

* Date
* Hour
* Status
* Customer

**Metrics (Y-Axis)**

* Order Count
* Total Revenue
* Average Order Value

**Filters**

* Date range
* Order status

Additional capabilities:

* Charts persist after refresh (localStorage)
* Dynamic chart titles
* Per-chart color themes
* Per-slice colors for Pie & Doughnut charts

---

## 🏗 Architecture

| Layer                   | Responsibility             |
| ----------------------- | -------------------------- |
| `OrdersService`         | Central data source        |
| `MapView`               | Live tracking (Today only) |
| `OrdersPanel`           | Live operational panel     |
| `AnalyticsService`      | Data aggregation logic     |
| `AnalyticsStateService` | Persistent chart state     |

Built using **Angular 21 Standalone Components** (no NgModules).

---

## 🧠 Key Concepts Implemented

* Angular 21 Signals
* Standalone Component Architecture
* Reactive Forms
* Chart.js integration
* Leaflet integration
* LocalStorage persistence
* Clean separation of operational vs analytical logic

---

## 📦 Tech Stack

* Angular 21
* TypeScript
* Angular Material
* Chart.js
* Leaflet.js
* JSON Server (Mock Backend)
* Netlify (Deployment)

---

## 🛠 Installation

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
ng serve
```

Open:

```
http://localhost:4200
```

---

## 📄 License

This project is built for learning and demonstration purposes.

---
