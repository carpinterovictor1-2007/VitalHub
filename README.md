# VitalHub Supreme 🚀
**The Ultimate Self-Hosted Health Ecosystem**

VitalHub Supreme is a high-performance, private health management platform. Built with a focus on security, privacy, and speed, it provides an enterprise-grade experience without the need for complex server installations.

## 🌟 Supreme Tech Stack

- **Core**: Node.js & ES6+ JavaScript.
- **Persistence**: **SQLite (SQL)** — High-performance database in a local file. No server install required.
- **Security**: 
  - **JWT (JSON Web Tokens)**: Stateless authentication for secure sessions.
  - **Bcrypt**: Industrial-strength password hashing.
  - **Helmet & CSP**: Professional headers protecting against XSS and Data Injection.
- **AI Engine**: Integrated **Google Gemini Pro** for nutritional synthesis.
- **SEO & Social**: Full **Open Graph (OG)** metadata for professional link previews.
- **Automation**: Native **PowerShell** scripts for Windows orchestration.

## 📂 Project Structure

```
/vitalhub
  ├── vitalhub.db         # The private SQL Database (auto-generated)
  ├── server.js           # The Secure Engine (Auth, SQLite, Proxy)
  ├── index.html          # Supreme UI with OG tags
  ├── diseño.css          # V2 Glassmorphism aesthetic
  ├── comando.js          # Authentication & Data Flow logic
  ├── .env                # Secret configurations
  ├── setup.ps1           # Automation: Install dependencies
  └── start.ps1           # Automation: Power up
```

## 🚀 Quick Start (Zero-Install)

1. **Setup**: Right-click `setup.ps1` and select **Run with PowerShell**. Or run `./setup.ps1` in your terminal.
2. **Configure**: Open `.env` and paste your `GEMINI_API_KEY`.
3. **Launch**: Right-click `start.ps1` and select **Run with PowerShell**.

## 🛡️ Privacy Commitment
VitalHub Supreme is 100% self-hosted. Your clinical records, heart-pulse logo, and nutritional data stay on **your** machine. No trackers, no bloat.

## 📈 Roadmap
- [x] Full-Stack JWT Auth
- [x] SQL Persistence
- [x] AI Recipe Proxy
- [x] Dark/Light Mode
- [ ] Exportable Health Pass (PDF)
- [ ] Multi-user clinical Vault
