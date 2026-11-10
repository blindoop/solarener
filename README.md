# Lumen Roof — O‘zbek oilalari uchun quyosh panellari

Ushbu repozitoriy **Lumen Roof** veb-saytining to‘liq manba kodi (`src/`) hamda GitHub Pages uchun tayyor yig‘ilgan frontend versiyasini (`docs/`) o‘z ichiga oladi.

---

## 🌐 Make the Live Website Visible on GitHub (GitHub Pages)

To view the **live interactive frontend website** instead of the source code files on GitHub:

### Option A — Automatic via `/docs` or `/ (root)` Branch (Fastest, Zero Build Wait)
1. Open your repository on **GitHub**.
2. Click **Settings** (top bar) → **Pages** (left sidebar).
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Choose branch **`main`** (or `master`) and folder **`/docs`** (or `/ (root)`), then click **Save**.
5. Your live website will be published at:
   `https://<your-github-username>.github.io/<repository-name>/`

### Option B — Automatic via GitHub Actions
1. Open **Settings** → **Pages** in your GitHub repository.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) will automatically compile the React/TypeScript app and publish the live website.

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

To rebuild the production static files (`dist/` and `docs/`):

```bash
npm run build
```
