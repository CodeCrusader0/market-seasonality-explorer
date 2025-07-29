# Market Seasonality Explorer

## Overview
The Market Seasonality Explorer is a React-based web application designed to visualize cryptocurrency market data seasonality using the Binance API. It features an interactive calendar interface for exploring daily, weekly, and monthly market metrics (price, volume, volatility, performance) and a detailed dashboard for analyzing selected date ranges. Advanced features include PDF/CSV/PNG export, custom color themes, data comparison, an alert system, anomaly detection, and animations, all built with accessibility and responsiveness in mind.

This project fulfills the requirements of the GoQuant frontend developer assignment, implementing all functional requirements and bonus features, with a focus on clean code, modular design, and robust error handling.

## Key Features
- **Interactive Calendar Component**  
  - Daily, Weekly, Monthly views with smooth transitions  
  - Navigation via buttons or swipe gestures  
  - Highlights today’s date; keyboard navigation (arrows, Enter, Escape)  
  - Visualizes volatility (heatmap), volume (bars), performance (arrows)  

- **Data Visualization Layers**  
  - **Volatility Heatmap**: Green (low), Orange (medium), Red (high)  
  - **Liquidity Indicators**: Striped volume bars scaled to maxVolume  
  - **Performance Metrics**: ▲ up, ▼ down, ▬ neutral  

- **Multi-Timeframe Support**  
  - **Daily**: Intraday metrics (volatility, volume, price change)  
  - **Weekly**: Aggregated summaries (avg. volatility, total volume, avg. close)  
  - **Monthly**: Monthly trends and highlights  

- **Interactive Features**  
  - Hover tooltips with detailed metrics  
  - Click to select date/range for dashboard view  
  - Date-range selection mode  
  - Filter toggles for metrics and periods  
  - Zoom-in/out for detailed analysis  

- **Data Dashboard Panel**  
  - Open/High/Low/Close, Volume, MA5/MA10, RSI, volatility, benchmark comparison  
  - Line & Bar charts for selected ranges  
  - Side-by-side period comparison  

- **Responsive Design**  
  - Works across devices and orientations  
  - Touch-friendly interactions on mobile  

- **Bonus Features**  
  - Export as PDF, CSV, PNG  
  - Multiple color themes (light, dark, high-contrast)  
  - Alerts for volatility/performance thresholds  
  - Anomaly detection (volatility > 3%)  
  - Smooth animations via Framer Motion  
  - Real-time Binance order book integration  

## Prerequisites
- Node.js v16+  
- npm v7+  
- Internet connection (Binance API)

## Setup & Run
1. **Clone repository**  
   ```bash
   git clone <repository-url>
   cd market-seasonality-explorer
   ```
2. **Install dependencies**  
   ```bash
   npm install
   ```
3. **Start development server**  
   ```bash
   npm start
   ```
   App runs at `http://localhost:5173`.
4. **Build for production**  
   ```bash
   npm run build
   ```

## File Structure
```
market-seasonality-explorer/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── marketDataService.ts
│   │   └── useIntraday.ts
│   ├── components/
│   │   └── Calendar/
│   │       ├── Calendar.tsx
│   │       ├── CalendarCell.tsx
│   │       ├── CalendarFilters.tsx
│   │       ├── CalendarGrid.tsx
│   │       ├── Calendar.module.scss
│   │       └── …other sub-components
│   ├── data/
│   │   └── types.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tsconfig.json
```

## Implementation Details
- **Calendar** and **DashboardPanel** components with smooth Framer Motion animations  
- **React Query** for data fetching & caching  
- **Chakra UI** for theming & responsive components  
- **html-to-image** & **jspdf** for exports  
- **Custom SCSS** for calendar heatmap styling

## Assumptions
- Binance API provides sufficient historical & order book data  
- Volatility = 5-day std dev of returns; anomaly if > 3%  
- MA5/MA10 for moving averages; RSI uses 14-day window  
- BTCUSDT as default benchmark


