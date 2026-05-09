# Deployment

The Colonna site is deployed to GitHub Pages by GitHub Actions.

## GitHub Pages Source

In the repository settings, open **Settings -> Pages** and set **Build and deployment -> Source** to **GitHub Actions**.

After this, new deployments should come from the `Deploy GitHub Pages` workflow. Do not use the `gh-pages` branch for new deploys.

## Automatic Deploy

The workflow lives in `.github/workflows/deploy-pages.yml`.

It runs automatically after every push to `main` and can also be started manually from **Actions -> Deploy GitHub Pages -> Run workflow**.

The workflow uses Node.js 20 and runs:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

If all checks pass, it uploads the generated `dist` directory with `actions/upload-pages-artifact` and publishes it with `actions/deploy-pages`.

The Vite `base` option must stay set to `/colonna/` in `vite.config.ts`, because the published URL is:

```text
https://kilevoy.github.io/colonna/
```

## Checking Status

Open the repository on GitHub and go to the **Actions** tab.

Select **Deploy GitHub Pages** to see the latest workflow runs. A successful run has green `Build` and `Deploy` jobs. The deploy job shows the published Pages URL after completion.

## Ignored Local Files

Local generated folders are ignored by git and should not be committed:

```text
node_modules/
dist/
.playwright-cli/
```
