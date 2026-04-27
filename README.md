# FairLens 🔍⚖️

<p align="center">
  <a href="https://github.com/fairlens/fairlens/actions/workflows/ci.yml/badge.svg">
    <img src="https://github.com/fairlens/fairlens/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://pypi.org/project/fairlens/">
    <img src="https://img.shields.io/pypi/v/fairlens" alt="PyPI" />
  </a>
  <a href="https://hub.docker.com/r/fairlens/fairlens">
    <img src="https://img.shields.io/docker/v/fairlens/fairlens?label=docker" alt="Docker" />
  </a>
  <a href="https://pypi.org/project/fairlens/">
    <img src="https://img.shields.io/pypi/pyversions/fairlens" alt="Python" />
  </a>
  <a href="https://github.com/fairlens/fairlens/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/fairlens/fairlens" alt="License" />
  </a>
</p>

<p align="center">
  <strong>Enterprise-grade AI fairness auditing platform</strong>
</p>

---

## What is FairLens?

FairLens is a full-stack SaaS platform that enables teams to upload datasets and trained models, then receive comprehensive, interactive fairness audit reports. Built for production use with model-format agnosticism, audit versioning, and enterprise compliance features.

<p align="center">
  <img src="https://raw.githubusercontent.com/fairlens/.github/main/docs/heatmap-preview.png" alt="FairLens Bias Heatmap" width="800" />
</p>

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Bias Heatmap** | D3-rendered visualization of feature × protected attribute combinations with severity scoring |
| 🧪 **What-if Simulator** | Interactive prediction playground with SHAP explanations |
| 📊 **Comprehensive Metrics** | Demographic Parity, Equal Opportunity, Disparate Impact, Equalized Odds |
| 🔌 **Model Agnostic** | Support for Pickle, ONNX, and external API endpoints |
| 📜 **Audit Versioning** | Complete audit trail with dataset/model hashes for compliance |
| 📈 **Drift Detection** | Track fairness metrics across audit history |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/fairlens/fairlens.git
cd fairlens

# Start with Docker Compose (recommended)
docker-compose up -d

# Or run locally
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install
npm run dev
```

Access the UI at `http://localhost:5173`

## 📖 Documentation

- [Getting Started](https://docs.fairlens.ai/getting-started)
- [API Reference](https://docs.fairlens.ai/api-reference)
- [Fairness Metrics Guide](https://docs.fairlens.ai/metrics)
- [Deployment Guide](https://docs.fairlens.ai/deployment)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│   React 18 + TypeScript + Vite + TailwindCSS + Recharts + D3  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                         Backend                                 │
│      FastAPI + SQLAlchemy + Celery + Redis                     │
├─────────────────────────────────────────────────────────────────┤
│  Fairness Engine: fairlearn | AIF360 | SHAP | ONNX Runtime     │
├─────────────────────────────────────────────────────────────────┤
│              Storage: PostgreSQL + S3/MinIO                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Available Packages

| Package | Description |
|---------|-------------|
| `@fairlens/ui` | React component library |
| `@fairlens/sdk` | JavaScript SDK for API integration |
| `fairlens-core` | Python fairness computation engine |
| `fairlens-cli` | Command-line interface |

## 🔧 Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS
- Recharts (metrics visualization)
- D3.js (bias heatmap)
- Zustand (state management)
- React Query (async data)

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy + PostgreSQL
- Celery + Redis
- fairlearn, AIF360, SHAP, ONNX Runtime

### Infrastructure
- Docker & Docker Compose
- Nginx
- AWS S3 / MinIO
- GitHub Actions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

```bash
# Run development environment
docker-compose -f docker-compose.dev.yml up

# Run tests
npm run test        # Frontend
pytest              # Backend

# Format code
npm run format      # Frontend
black .             # Backend
```

## 📄 License

Licensed under the [MIT License](LICENSE).

## 🔗 Links

- **[Live Demo](https://fairlens.ai/demo)** - Try it out
- **[Documentation](https://docs.fairlens.ai)** - Full docs
- **[Discord](https://discord.gg/fairlens)** - Community
- **[Blog](https://fairlens.ai/blog)** - Updates & guides
- **[Twitter](https://twitter.com/fairlensai)** - Follow us

---

<p align="center">
  Made with ❤️ by the FairLens team
</p>