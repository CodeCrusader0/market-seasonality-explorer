Market Seasonality Explorer

Overview

The Market Seasonality Explorer is a React-based application designed to visualize historical volatility, liquidity, and performance data for financial instruments across daily, weekly, and monthly timeframes. Developed as part of the GoQuant frontend developer recruitment process, this project showcases React skills, component reusability, and data visualization capabilities using real-time cryptocurrency orderbook data.Project SetupPrerequisitesNode.js (v18.x or later)
npm or yarn
A code editor (e.g., VS Code)

Installation 

Clone the repository:bash
git clone https://github.com/your-username/market-seasonality-explorer.git
Navigate to the project directory:bash
cd market-seasonality-explorer/market-seasonality-explorer
npm install
Start the development server:bash
npm run dev

Features
1. Interactive Calendar ComponentCustom calendar with daily, weekly, and monthly views.
Smooth transitions between timeframes using CSS animations and React state management.
Navigation between months/years via UI buttons and keyboard (arrow keys, Enter, Escape).
Today’s date (July 29, 2025, 03:01 PM IST) highlighted with a blue circle.

2. Data Visualization LayersVolatility Heatmap: Cells color-coded based on volatility levels:Low: Green shades
Medium: Yellow/Orange shades
High: Red shades,
Liquidity Indicators: Trading volume shown with volume bars and striped gradients.
Performance Metrics: Price changes visualized with upward (green) arrows, downward (red) arrows, or neutral (gray) indicators.

4. Multi-Timeframe SupportDaily View: Displays intraday volatility ranges, trading volume, and price change percentages.
Weekly View: Aggregates data into weekly summaries with average volatility, total volume, and performance.
Monthly View: Provides an overview with monthly volatility trends, liquidity patterns, and performance highlights.

5. Interactive FeaturesHover Effects: Tooltips display detailed metrics (e.g., Open, High, Low, Close) on hover.
Click Interactions: Clicking a date opens a detailed breakdown in the dashboard panel.
Selection Mode: Enables date range selection for custom analysis.
Filter Controls: Filters for financial instruments (e.g., BTC/USDT), time periods, and metric types.
Zoom Functionality: Zoom-in/zoom-out for detailed analysis using a slider or buttons.

6. Data Dashboard Panel:  Toggleable panel displays comprehensive metrics when a date/period is selected:Opening, closing, high, low prices
Volume and liquidity metrics
Volatility (standard deviation)
Performance comparisons to a benchmark (e.g., 50-day MA)
Technical indicators (e.g., RSI, Moving Averages)

7. Responsive DesignSeamless operation across desktop, tablet, and mobile devices.
Touch-friendly interactions for mobile.
Optimized layout for portrait and landscape orientations.
Maintains readability with adjustable font sizes and spacing.

Bonus Features

Export Functionality: Export calendar data as CSV, PNG, or PDF.

Custom Color Schemes: Default, high-contrast, and colorblind-friendly themes.

Data Comparison: Side-by-side comparison of two time periods.

Alert System: Alerts for volatility or performance thresholds (configurable).

Historical Patterns: Highlights recurring patterns or anomalies with dashed borders.

Animation Effects: Smooth transitions for data loading and UI interactions.

Libraries and ToolsReact: Core framework (created with Create React App).

Chakra UI: UI component library for responsive design.

Recharts: Charting library for visualizations.

Axios: HTTP client for Binance API integration.

html2canvas & jsPDF: For export functionality.

Binance API provides sufficient free-tier data for demo purposes (BTC/USDT pair).
Volatility is calculated as a simple standard deviation of daily price changes.
Performance benchmarks are based on a 50-day moving average.
Edge cases (e.g., no data, API errors) are handled with fallback UI states.


Data Scenarios and Edge CasesNormal Scenario: Fully populated calendar with BTC/USDT data.
No Data: Displays a "No data available" message with a retry option.
API Failure: Shows an error state with a refresh button.
Large Date Range: Optimizes rendering with virtualization techniques.

