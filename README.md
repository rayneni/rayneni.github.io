# rval.dev

Personal site for [rval.dev](https://rval.dev), served from GitHub Pages (`rayneni.github.io`).

## Local preview

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Deploy to GitHub Pages

1. Push this repo to `github.com/rayneni/rayneni.github.io` on the `main` branch.
2. In the repo **Settings → Pages**, set source to **Deploy from branch** → `main` → `/ (root)`.
3. Under **Custom domain**, enter `rval.dev` and save (the `CNAME` file in the repo should match).
4. At your DNS provider, add:
   - **A** records for `@` pointing to GitHub Pages IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **CNAME** for `www` → `rayneni.github.io` (optional, if you use `www`)

GitHub’s [custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) have the latest IP list and TLS details.

## Customize

- Edit copy in `index.html`.
- Update contact email and social links in the Contact section.
- Adjust colors and typography in `styles.css` (`:root` variables).
