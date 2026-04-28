<h1 align="center">⚖️ FairLens – Enterprise-grade AI fairness auditing platform</h1>

> <p align="center">🚨 <strong>"FairLens is a full-stack SaaS platform that enables teams to upload datasets and trained models, then receive comprehensive, interactive fairness audit reports. Built for production use with model-format agnosticism, audit versioning, and enterprise compliance features."</strong></p>

<div align="center">

<a href="https://shiksha-disha.vercel.app/" target="_blank">
    <img  style="width:350px;" src="https://img.shields.io/badge/🚀_Access_the_Prototype_Here-Live-brightgreen?style=for-the-badge&labelColor=80FF80" alt="Access the Prototype Here"  />
</a>

![Phase](https://img.shields.io/badge/🛠️%20Phase-In%20Development-blue?style=for-the-badge)
![Platforms](https://img.shields.io/badge/🌐%20Platforms-Web%20%7C%20Android*-28a745?style=for-the-badge)

</div>

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Bias Heatmap** | D3-rendered visualization of feature × protected attribute combinations with severity scoring |
| 🧪 **What-if Simulator** | Interactive prediction playground with SHAP explanations |
| 📊 **Comprehensive Metrics** | Demographic Parity, Equal Opportunity, Disparate Impact, Equalized Odds |
| 🔌 **Model Agnostic** | Support for Pickle, ONNX, and external API endpoints |
| 📜 **Audit Versioning** | Complete audit trail with dataset/model hashes for compliance |
| 📈 **Drift Detection** | Track fairness metrics across audit history |

## 🚀 Quick Start (Local)

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

## 🚀 Quick Deploy (100% Cloud - No Local Setup)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Create project at https://console.firebase.google.com
#    Enable: Authentication, Firestore, Storage, Hosting

# 4. Initialize
firebase init
#   Select: Hosting, Functions, Firestore, Storage

# 5. Build frontend
cd frontend && npm install && npm run build && cd ..

# 6. Deploy (uses free tier!)
firebase deploy
```

**Done!** Your app is live at `https://your-project.web.app`

See [DEPLOY.md](DEPLOY.md) for detailed instructions.

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
│   React 18 + TypeScript + Nextjs + TailwindCSS + Recharts + D3  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                         Backend                                 │
│      FastAPI + SQLAlchemy + Celery + Redis                      │
├─────────────────────────────────────────────────────────────────┤
│  Fairness Engine: fairlearn | AIF360 | SHAP | ONNX Runtime      │
├─────────────────────────────────────────────────────────────────┤
│              Storage: PostgreSQL + S3/MinIO                     │
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
- React 18 + TypeScript + Nextjs
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

## ☁️ Cloud Deploy (100% Free Tier)

For Google Solution Challenge 2026, FairLens can be deployed entirely on Google Cloud:

| Service | Free Tier | Purpose |
|---------|----------|---------|
| Firebase Hosting | 1 GB | Frontend |
| Firestore | 20K reads/writes | Database |
| Firebase Storage | 5 GB | File uploads |
| Cloud Functions | 2M invocations | API Backend |
| Gemini (Free) | 15 RPM, 1M tokens | AI Insights |

**Total Cost: $0**

### Cloud Architecture

```
Users → Firebase Hosting (Next.js)
           ↓
    Cloud Functions (Python)
           ↓
    Firestore + Storage
           ↓
    Gemini API (AI Insights)
```

### Quick Deploy

See [DEPLOY.md](DEPLOY.md) for one-command deploy!

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

## 🔗 Links

- **[Live Demo](https://fairlens.ai/demo)** - Try it out
- **[Documentation](https://docs.fairlens.ai)** - Full docs
- **[Discord](https://discord.gg/fairlens)** - Community
- **[Blog](https://fairlens.ai/blog)** - Updates & guides
- **[Twitter](https://twitter.com/fairlensai)** - Follow us



## 👥 Our Google Solution Challenge 2026 Hackathon Team (DevBandits)

<div align="center">

<table>
  <tr>
    <td colspan="4" align="center">
      <img width="384" height="168" alt="DevBandits Banner" src="https://github.com/user-attachments/assets/626dba91-4d4a-4c6a-9e87-9e9730fea018" />
    </td>
  </tr>

  <tr>
    <th>#</th>
    <th>Team Member</th>
    <th>Role</th>
    <th>GitHub Profile</th>
  </tr>

  <tr>
    <td align="center">1</td>
    <td><b>Abdur Rahman Qasim</b></td>
    <td>🎯 Team Lead</td>
    <td><a href="https://github.com/Abdur-rahman-01">🔗 FareedAhmedOwais</a></td>
  </tr>

  <tr>
    <td align="center">2</td>
    <td><b>Fareed Ahmed Owais</b></td>
    <td>🖼️ Frontend Developer</td>
    <td><a href="https://github.com/FareedAhmedOwais">🔗 Abdur-rahman-01</a></td>
  </tr>

  <tr>
    <td align="center">3</td>
    <td><b>Mohammed Saad Uddin</b></td>
    <td>🚀 Full-stack + AI/ML Developer</td>
    <td><a href="https://github.com/saad2134">🔗 saad2134</a></td>
  </tr>

  <tr>
    <td align="center">4</td>
    <td><b>Mohammed Abdul Rahman</b></td>
    <td>🎨 UI/UX Designer</td>
    <td><a href="https://github.com/Abdul-Rahman26">🔗 saad2134</a></td>
  </tr>
</table>



</div>


## 📊 **Repo Stats**

<div align="center">
  
![Repo Size](https://img.shields.io/github/repo-size/saad2134/FairLens)
![Last Commit](https://img.shields.io/github/last-commit/saad2134/FairLens)
![Open Issues](https://img.shields.io/github/issues/saad2134/FairLens)
![Open PRs](https://img.shields.io/github/issues-pr/saad2134/FairLens)
![License](https://img.shields.io/github/license/saad2134/FairLens)
![Forks](https://img.shields.io/github/forks/saad2134/FairLens?style=social)
![Stars](https://img.shields.io/github/stars/saad2134/FairLens?style=social)
![Watchers](https://img.shields.io/github/watchers/saad2134/FairLens?style=social)
![Contributors](https://img.shields.io/github/contributors/saad2134/FairLens)
![Languages](https://img.shields.io/github/languages/count/saad2134/FairLens)
![Top Language](https://img.shields.io/github/languages/top/saad2134/FairLens)

</div>


## ⭐ Star History

<a href="https://www.star-history.com/#saad2134/FairLens&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=saad2134/FairLens&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=saad2134/FairLens&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=saad2134/FairLens&type=Date" />
 </picture>
</a>

---

## ✍️ Endnote
<p align="center">Developed with 💖 for the Google Solution Challenge 2026 Hackathon (powered by Hack2Skill), with heartfelt thanks for the opportunity to build and innovate.</p>

---

## 🏷 Tags  

`#WebApp` 
