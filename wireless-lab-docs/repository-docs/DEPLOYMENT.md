# GitHub Pages deployment

Source workflow: `.github/workflows/pages.yml`.

The workflow runs on pushes to `main`.

## Steps

1. Checkout with `actions/checkout@v4`.
2. Run `node tools/build-content.js`.
3. Configure Pages with `actions/configure-pages@v5`.
4. Upload repository artifact with `actions/upload-pages-artifact@v3`.
5. Deploy with `actions/deploy-pages@v4`.

Permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

The committed workflow sets `LAB_SKIP_AUTO_TRANSLATE=1` during the build.

Publishing is therefore tied to a push to `main`; agents should not push or
publish without explicit user request.
