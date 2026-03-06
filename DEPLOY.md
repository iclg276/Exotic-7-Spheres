# GitHub Pages deploy checklist

If you see **"Loading module ... /src/main.js was blocked (MIME type text/html)"**, the browser is loading the **source** site, not the **built** one.

## 1. Pages must use the `gh-pages` branch

- Repo **Settings → Pages**
- **Source**: **Deploy from a branch**
- **Branch**: `gh-pages` (not `main`), folder **/ (root)**
- Save

The workflow pushes the built `dist/` to `gh-pages`. Only that branch should be used for Pages.

## 2. Open the project URL (with repo name)

The app is built with a **base path** = repo name. So the correct URL is:

**`https://<your-username>.github.io/<repo-name>/`**

Examples:

- Repo `Exotic-7-Spheres` → `https://iclq276.github.io/Exotic-7-Spheres/`
- Repo `m7_proj` → `https://iclq276.github.io/m7_proj/`

Do **not** open:

- `https://iclq276.github.io/` (root; no repo name)
- `https://iclq276.github.io/Exotic-7-Spheres` (missing trailing `/` can break asset paths)

## 3. After pushing

1. Push to `main` → workflow runs and updates `gh-pages`.
2. Wait ~30 seconds, then open `https://<username>.github.io/<repo-name>/`.
3. If it still fails, in **Actions** check that the last workflow run succeeded and that **Settings → Pages** is set to branch **gh-pages**.
