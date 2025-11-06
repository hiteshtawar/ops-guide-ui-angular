# OpsGuide UI - Angular Version

A clean, modern Angular 13.3 application for the OpsGuide operational intelligence platform. This is the Angular version converted from the React implementation.

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm
- Angular CLI 13.3
- OpsGuide backend running on `http://localhost:8093`

### Installation

```bash
npm install
```

### Development

```bash
npm start
# or
ng serve
```

The app will be available at `http://localhost:4200` (or the next available port).

### Build

```bash
npm run build
# or
ng build
```

### Production Build

```bash
ng build --configuration production
```

## Features

- 🎨 Clean, minimalist design inspired by Claude
- ⏰ Time-based greetings (Good morning/afternoon/evening/night)
- 📱 Fully responsive and adaptive to all screen sizes
- ⚡ Real-time API integration with the OpsGuide backend using RxJS
- 📋 Structured response display with classification results
- 🔄 Reactive forms with Angular FormsModule
- 📡 HTTP client using RxJS Observables (no signals)

## Tech Stack

- **Angular 13.3** with TypeScript
- **RxJS** for HTTP calls and reactive programming
- **Angular Reactive Forms** for form handling
- **Angular HttpClient** for API communication
- **CSS3** for styling (no external CSS frameworks)

## Project Structure

```
src/
  ├── app/
  │   ├── models/
  │   │   └── types.ts          # TypeScript interfaces
  │   ├── services/
  │   │   └── api.service.ts    # HTTP service using RxJS
  │   ├── app.component.ts      # Main component
  │   ├── app.component.html    # Template
  │   ├── app.component.css     # Styles
  │   └── app.module.ts         # Root module
  ├── assets/                    # Static assets
  └── environments/              # Environment configs
```

## API Configuration

The API endpoint is configured in `src/app/services/api.service.ts`. By default, it connects to:
- **Base URL**: `http://localhost:8093`
- **Process Endpoint**: `/api/v1/process`
- **Step Execution Endpoint**: `/v1/steps/execute`

## Usage

1. Start the OpsGuide backend server:
   ```bash
   cd /path/to/ops-guide-mvp
   python server.py
   ```

2. Start this Angular UI:
   ```bash
   npm start
   ```

3. Open your browser and type a request like:
   - `cancel case CASE-2024-TEST-001`
   - `cancel order ORDER-2024-001`
   - `change order status to completed`

## Key Differences from React Version

- Uses Angular Reactive Forms instead of React state
- HTTP calls use RxJS Observables instead of async/await
- Component lifecycle managed by Angular (OnInit, etc.)
- Template syntax uses Angular directives (*ngIf, *ngFor, etc.)
- Service-based architecture for API calls

## Development Notes

- All HTTP methods use RxJS Observables
- No Angular signals (using RxJS for reactivity)
- Form validation handled by Angular Reactive Forms
- Error handling uses RxJS catchError operator
