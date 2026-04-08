# AI-OFDM Research Dashboard

A professional, research-grade interactive web application for an AI-based OFDM communication system.

---

## Folder Structure

```
ai-ofdm-dashboard/
├── backend/
│   ├── backend.py          # FastAPI + PyTorch simulation server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React dashboard (ofdm_dashboard.jsx)
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
└── README.md
```

---

## Quick Start

### 1. Backend (FastAPI + PyTorch)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn torch numpy pydantic

# Run the API server (trains the model on first startup ~2 min)
cd backend
uvicorn backend:app --reload --port 8000
```

API will be live at: `http://localhost:8000`  
Auto-docs (Swagger UI): `http://localhost:8000/docs`

---

### 2. Frontend (React + Vite)

```bash
# Create Vite project
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install recharts lucide-react

# Copy ofdm_dashboard.jsx → src/App.jsx
cp ../ofdm_dashboard.jsx src/App.jsx

# Start dev server
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-constellation` | AI-learned & 16-QAM points |
| GET | `/compute-ber?snr_min=0&snr_max=20&channel=both` | BER sweep |
| GET | `/compute-papr?trials=100` | PAPR + CCDF data |
| POST | `/run-simulation` | Single-SNR real-time sim |
| GET | `/training-loss` | Full loss curve |
| POST | `/train?epochs=2000` | Re-train model |

### Example: Fetch BER data

```js
const res = await fetch("http://localhost:8000/compute-ber?snr_min=0&snr_max=20&snr_step=2&channel=both&trials=10");
const { data } = await res.json();
// data = [{ snr, ai_awgn, qam_awgn, ai_rayleigh, qam_rayleigh }, ...]
```

---

## Connecting Frontend to Live Backend

In `ofdm_dashboard.jsx`, replace the static `berData` / `ccdfData` / `aiPoints` constants with `useEffect` API calls:

```jsx
const [berData, setBerData] = useState([]);

useEffect(() => {
  fetch("http://localhost:8000/compute-ber?channel=both&trials=10")
    .then(r => r.json())
    .then(({ data }) => {
      setBerData(data.map(d => ({
        ...d,
        ai_awgn:      Math.log10(Math.max(d.ai_awgn, 1e-7)),
        qam_awgn:     Math.log10(Math.max(d.qam_awgn, 1e-7)),
        ai_rayleigh:  Math.log10(Math.max(d.ai_rayleigh, 1e-7)),
        qam_rayleigh: Math.log10(Math.max(d.qam_rayleigh, 1e-7)),
      })));
    });
}, []);
```

---

## Model Architecture

```
Input Symbols  →  ConstellationMapper (Embedding 16×2)
              →  Encoder   (Linear 32→256→256→32)
              →  OFDM Mod  (IFFT + Cyclic Prefix)
              →  Channel   (AWGN or Rayleigh)
              →  OFDM Demod (Remove CP + FFT)
              →  Equalizer  (Per-subcarrier 2→16→2)
              →  Decoder    (Linear 32→256→256→256)
              →  Predicted Symbols (CrossEntropyLoss)
```

**Total parameters:** ~198,000  
**Training SNR:** 15 dB AWGN  
**Optimizer:** Adam (lr=0.001)

---

## PAPR Reduction Techniques

| Technique | Avg PAPR | Reduction |
|-----------|----------|-----------|
| Baseline  | 8.72 dB  | —         |
| SLM       | 6.84 dB  | -1.88 dB  |
| Clipping  | 5.18 dB  | -3.54 dB  |
| Tone Res. | 7.41 dB  | -1.31 dB  |

---

## Requirements

**Python:** `fastapi uvicorn torch numpy pydantic`  
**Node:** `react recharts lucide-react`  
**GPU:** Optional (CUDA auto-detected)
