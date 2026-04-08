"""
AI-OFDM Research Dashboard — FastAPI Backend
============================================
Runs the PyTorch OFDM simulation and exposes JSON endpoints
consumed by the React frontend.

Run:  uvicorn backend:app --reload --port 8000
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
import numpy as np
from typing import Literal

# ──────────────────────────────────────────────────────────
# HYPER-PARAMETERS
# ──────────────────────────────────────────────────────────
N      = 16          # OFDM sub-carriers
CP_LEN = 4           # Cyclic-prefix length
M      = 16          # Constellation size (16-QAM)
BITS   = 4           # Bits per symbol
BATCH  = 512

device = "cuda" if torch.cuda.is_available() else "cpu"

# ──────────────────────────────────────────────────────────
# MODEL DEFINITIONS
# ──────────────────────────────────────────────────────────

class ConstellationMapper(nn.Module):
    def __init__(self):
        super().__init__()
        self.embedding = nn.Embedding(M, 2)

    def forward(self, symbols):
        return torch.view_as_complex(self.embedding(symbols))


class Encoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(2 * N, 256), nn.ReLU(),
            nn.Linear(256, 256),   nn.ReLU(),
            nn.Linear(256, 2 * N),
        )

    def forward(self, x):
        return self.net(x)


class Equalizer(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(2, 16), nn.ReLU(),
            nn.Linear(16, 2),
        )

    def forward(self, x):
        x = x.view(-1, N, 2)
        return (x + self.net(x)).reshape(-1, 2 * N)


class Decoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(2 * N, 256), nn.ReLU(),
            nn.Linear(256, 256),   nn.ReLU(),
            nn.Linear(256, N * M),
        )

    def forward(self, x):
        return self.net(x).view(-1, N, M)


# ──────────────────────────────────────────────────────────
# INSTANTIATE & TRAIN (or load checkpoint)
# ──────────────────────────────────────────────────────────

mapper    = ConstellationMapper().to(device)
encoder   = Encoder().to(device)
equalizer = Equalizer().to(device)
decoder   = Decoder().to(device)

optimizer = torch.optim.Adam(
    list(mapper.parameters()) +
    list(encoder.parameters()) +
    list(equalizer.parameters()) +
    list(decoder.parameters()),
    lr=1e-3,
)
loss_fn = nn.CrossEntropyLoss()

_loss_history: list[float] = []


def train_model(epochs: int = 2000):
    """Run training loop. Called once on startup (or via /train endpoint)."""
    global _loss_history
    _loss_history = []
    for epoch in range(epochs):
        symbols = torch.randint(0, M, (BATCH, N), device=device)
        const   = mapper(symbols)
        x       = torch.view_as_real(const).reshape(BATCH, -1)
        enc     = encoder(x)
        power   = torch.mean(enc ** 2, dim=1, keepdim=True)
        enc     = enc / torch.sqrt(power + 1e-8)
        enc_c   = torch.view_as_complex(enc.reshape(BATCH, N, 2))
        tx      = ofdm_mod(enc_c)
        rx      = awgn_channel(tx, snr_db=15)
        rx_freq = ofdm_demod(rx)
        rx_real = torch.view_as_real(rx_freq).reshape(BATCH, -1)
        eq      = equalizer(rx_real)
        logits  = decoder(eq)
        loss    = loss_fn(logits.reshape(-1, M), symbols.reshape(-1))
        _loss_history.append(loss.item())
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if epoch % 200 == 0:
            print(f"Epoch {epoch:4d}  Loss {loss.item():.4f}")
    print("Training complete.")


# ──────────────────────────────────────────────────────────
# DSP / CHANNEL HELPERS
# ──────────────────────────────────────────────────────────

def ofdm_mod(x: torch.Tensor) -> torch.Tensor:
    t  = torch.fft.ifft(x, norm="ortho")
    cp = t[:, -CP_LEN:]
    return torch.cat([cp, t], dim=1)


def ofdm_demod(x: torch.Tensor) -> torch.Tensor:
    return torch.fft.fft(x[:, CP_LEN:], norm="ortho")


def awgn_channel(signal: torch.Tensor, snr_db: float) -> torch.Tensor:
    snr         = 10 ** (snr_db / 10)
    power       = torch.mean(torch.abs(signal) ** 2)
    noise_power = power / snr
    noise       = torch.sqrt(noise_power / 2) * (
        torch.randn_like(signal) + 1j * torch.randn_like(signal)
    )
    return signal + noise


def rayleigh_channel(signal: torch.Tensor, snr_db: float) -> torch.Tensor:
    snr  = 10 ** (snr_db / 10)
    h    = (torch.randn(signal.shape[0], 1, device=signal.device)
            + 1j * torch.randn(signal.shape[0], 1, device=signal.device)) / np.sqrt(2)
    rx   = signal * h
    pw   = torch.mean(torch.abs(rx) ** 2)
    n    = torch.sqrt(pw / snr / 2) * (
        torch.randn_like(rx) + 1j * torch.randn_like(rx)
    )
    return (rx + n) / h


def calculate_papr(signal: torch.Tensor) -> float:
    power = torch.abs(signal) ** 2
    return (10 * torch.log10(power.max() / power.mean())).item()


def symbols_to_bits(sym: torch.Tensor) -> torch.Tensor:
    return ((sym.unsqueeze(-1) >> torch.arange(BITS, device=sym.device)) & 1).reshape(sym.shape[0], -1)


def classical_16qam(symbols: torch.Tensor) -> torch.Tensor:
    levels = torch.tensor([-3, -1, 1, 3], dtype=torch.float32, device=device) / np.sqrt(10)
    i = levels[symbols % 4]
    q = levels[symbols // 4]
    return i + 1j * q


def qam16_decode(rx: torch.Tensor) -> torch.Tensor:
    levels = torch.tensor([-3, -1, 1, 3], dtype=torch.float32, device=device) / np.sqrt(10)
    i_idx  = torch.argmin(torch.abs(rx.real.unsqueeze(-1) - levels), dim=-1)
    q_idx  = torch.argmin(torch.abs(rx.imag.unsqueeze(-1) - levels), dim=-1)
    return i_idx + 4 * q_idx


# ──────────────────────────────────────────────────────────
# PAPR REDUCTION TECHNIQUES
# ──────────────────────────────────────────────────────────

def slm(x: torch.Tensor, num_candidates: int = 8) -> torch.Tensor:
    best    = ofdm_mod(x)
    best_p  = calculate_papr(best)
    for _ in range(num_candidates - 1):
        phase = torch.exp(1j * 2 * np.pi * torch.rand_like(x.real))
        cand  = ofdm_mod(x * phase)
        p     = calculate_papr(cand)
        if p < best_p:
            best, best_p = cand, p
    return best


def clipping(x: torch.Tensor, ratio: float = 1.2) -> torch.Tensor:
    rms       = torch.sqrt(torch.mean(torch.abs(x) ** 2))
    threshold = ratio * rms
    return torch.where(torch.abs(x) > threshold, x * threshold / (torch.abs(x) + 1e-9), x)


def tone_reservation(x: torch.Tensor) -> torch.Tensor:
    x = x.clone()
    x[:, :2]  = 0
    x[:, -2:] = 0
    return ofdm_mod(x)


# ──────────────────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────────────────

app = FastAPI(title="AI-OFDM Research API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    print("Training model on startup …")
    train_model(epochs=2000)


# ── /get-constellation ──────────────────────────────────

@app.get("/get-constellation")
def get_constellation():
    """Return AI-learned and classical 16-QAM constellation points."""
    ai_pts  = mapper.embedding.weight.detach().cpu().numpy()
    qam_raw = np.array([
        [-3,-3],[-3,-1],[-3,1],[-3,3],
        [-1,-3],[-1,-1],[-1,1],[-1,3],
        [1,-3],[1,-1],[1,1],[1,3],
        [3,-3],[3,-1],[3,1],[3,3],
    ], dtype=float) / np.sqrt(10)

    return {
        "ai": [{"i": float(p[0]), "q": float(p[1]), "label": k}
               for k, p in enumerate(ai_pts)],
        "qam": [{"i": float(p[0]), "q": float(p[1]), "label": k}
                for k, p in enumerate(qam_raw)],
    }


# ── /compute-ber ───────────────────────────────────────

@app.get("/compute-ber")
def compute_ber(
    snr_min: float = 0,
    snr_max: float = 20,
    snr_step: float = 2,
    trials: int = 10,
    channel: Literal["awgn", "rayleigh", "both"] = "both",
):
    """Sweep SNR and return BER for AI system and classical 16-QAM."""
    snr_range = np.arange(snr_min, snr_max + 1e-9, snr_step)
    results   = []

    for snr_db in snr_range:
        err_ai_awgn = err_ai_ray = err_qam_awgn = err_qam_ray = total = 0

        for _ in range(trials):
            symbols   = torch.randint(0, M, (BATCH, N), device=device)
            true_bits = symbols_to_bits(symbols)

            const = mapper(symbols)
            x     = torch.view_as_real(const).reshape(BATCH, -1)
            enc   = encoder(x)
            enc   = enc / torch.sqrt(torch.mean(enc**2, dim=1, keepdim=True) + 1e-8)
            enc_c = torch.view_as_complex(enc.reshape(BATCH, N, 2))
            tx    = ofdm_mod(enc_c)

            # ── AI AWGN
            if channel in ("awgn", "both"):
                rx = ofdm_demod(awgn_channel(tx, snr_db))
                eq = equalizer(torch.view_as_real(rx).reshape(BATCH, -1))
                pred_ai_awgn = torch.argmax(decoder(eq), dim=2)
                err_ai_awgn += (true_bits != symbols_to_bits(pred_ai_awgn)).sum().item()

            # ── AI Rayleigh
            if channel in ("rayleigh", "both"):
                rx = ofdm_demod(rayleigh_channel(tx, snr_db))
                eq = equalizer(torch.view_as_real(rx).reshape(BATCH, -1))
                pred_ai_ray = torch.argmax(decoder(eq), dim=2)
                err_ai_ray += (true_bits != symbols_to_bits(pred_ai_ray)).sum().item()

            # ── Classical 16-QAM AWGN
            qam = classical_16qam(symbols)
            tx_q = ofdm_mod(qam)
            if channel in ("awgn", "both"):
                rx_q = ofdm_demod(awgn_channel(tx_q, snr_db))
                pred_qam_awgn = qam16_decode(rx_q)
                err_qam_awgn += (true_bits != symbols_to_bits(pred_qam_awgn)).sum().item()

            if channel in ("rayleigh", "both"):
                rx_q = ofdm_demod(rayleigh_channel(tx_q, snr_db))
                pred_qam_ray = qam16_decode(rx_q)
                err_qam_ray += (true_bits != symbols_to_bits(pred_qam_ray)).sum().item()

            total += true_bits.numel()

        row = {"snr": float(snr_db)}
        if channel in ("awgn", "both"):
            row["ai_awgn"]  = err_ai_awgn / total
            row["qam_awgn"] = err_qam_awgn / total
        if channel in ("rayleigh", "both"):
            row["ai_rayleigh"]  = err_ai_ray / total
            row["qam_rayleigh"] = err_qam_ray / total
        results.append(row)

    return {"data": results}


# ── /compute-papr ─────────────────────────────────────

@app.get("/compute-papr")
def compute_papr(trials: int = 100):
    """Return PAPR values for baseline + reduction techniques."""
    baseline_v, slm_v, clip_v, tone_v = [], [], [], []

    with torch.no_grad():
        for _ in range(trials):
            symbols = torch.randint(0, M, (BATCH, N), device=device)
            const   = mapper(symbols)
            x       = torch.view_as_real(const).reshape(BATCH, -1)
            enc     = encoder(x)
            enc     = enc / torch.sqrt(torch.mean(enc**2, dim=1, keepdim=True) + 1e-8)
            enc_c   = torch.view_as_complex(enc.reshape(BATCH, N, 2))

            base = ofdm_mod(enc_c)
            baseline_v.append(calculate_papr(base))
            slm_v.append(calculate_papr(slm(enc_c)))
            clip_v.append(calculate_papr(clipping(base)))
            tone_v.append(calculate_papr(tone_reservation(enc_c)))

    def ccdf(values, xs):
        arr = np.array(values)
        return [float(np.mean(arr > x)) for x in xs]

    xs = [float(x) for x in np.linspace(2, 12, 60)]

    return {
        "means": {
            "baseline": float(np.mean(baseline_v)),
            "slm":      float(np.mean(slm_v)),
            "clipping": float(np.mean(clip_v)),
            "toneRes":  float(np.mean(tone_v)),
        },
        "ccdf": {
            "x":        xs,
            "baseline": ccdf(baseline_v, xs),
            "slm":      ccdf(slm_v, xs),
            "clipping": ccdf(clip_v, xs),
            "toneRes":  ccdf(tone_v, xs),
        },
        "raw": {
            "baseline": baseline_v[:50],
            "slm":      slm_v[:50],
            "clipping": clip_v[:50],
            "toneRes":  tone_v[:50],
        },
    }


# ── /run-simulation ───────────────────────────────────

class SimConfig(BaseModel):
    snr_db:  float = 10.0
    channel: Literal["awgn", "rayleigh"] = "awgn"
    trials:  int   = 5

@app.post("/run-simulation")
def run_simulation(cfg: SimConfig):
    """Quick single-SNR simulation for real-time frontend updates."""
    err_ai = err_qam = total = 0
    with torch.no_grad():
        for _ in range(cfg.trials):
            symbols   = torch.randint(0, M, (BATCH, N), device=device)
            true_bits = symbols_to_bits(symbols)

            const = mapper(symbols)
            x     = torch.view_as_real(const).reshape(BATCH, -1)
            enc   = encoder(x)
            enc   = enc / torch.sqrt(torch.mean(enc**2, dim=1, keepdim=True) + 1e-8)
            enc_c = torch.view_as_complex(enc.reshape(BATCH, N, 2))
            tx    = ofdm_mod(enc_c)

            ch = awgn_channel if cfg.channel == "awgn" else rayleigh_channel
            rx = ofdm_demod(ch(tx, cfg.snr_db))
            eq = equalizer(torch.view_as_real(rx).reshape(BATCH, -1))
            pred_ai = torch.argmax(decoder(eq), dim=2)

            qam   = classical_16qam(symbols)
            rx_q  = ofdm_demod(ch(ofdm_mod(qam), cfg.snr_db))
            pred_q = qam16_decode(rx_q)

            err_ai  += (true_bits != symbols_to_bits(pred_ai)).sum().item()
            err_qam += (true_bits != symbols_to_bits(pred_q)).sum().item()
            total   += true_bits.numel()

    return {
        "snr_db":   cfg.snr_db,
        "channel":  cfg.channel,
        "ber_ai":   err_ai  / total,
        "ber_qam":  err_qam / total,
        "gain":     (err_qam - err_ai) / total,
    }


# ── /training-loss ────────────────────────────────────

@app.get("/training-loss")
def training_loss():
    """Return the recorded loss curve."""
    return {"data": [{"epoch": i * 1, "loss": v} for i, v in enumerate(_loss_history)]}


# ── /train ────────────────────────────────────────────

@app.post("/train")
def retrain(epochs: int = Query(default=2000, ge=100, le=10000)):
    """Re-train the model (long-running – use async in production)."""
    train_model(epochs=epochs)
    return {"status": "done", "epochs": epochs, "final_loss": _loss_history[-1]}

