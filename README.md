# JPA — JagoPakaiAI

Hub SKILL.MD, DESIGN.MD & MCP untuk AI Agent Indonesia.

**Website**: [jpa.my.id](https://jpa.my.id)

## Stack

- **Static Site Generator**: [Eleventy (11ty)](https://www.11ty.dev/)
- **Headless CMS**: [Sveltia CMS](https://github.com/sveltia/sveltia-cms)
- **Hosting**: [Netlify](https://www.netlify.com/) (Free tier)
- **Auth**: GitHub OAuth via Netlify Functions

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Content Structure

```
content/
├── site.json                    # Global site settings
├── hero.json                    # Homepage hero content
├── jpacli.json                  # JPA CLI page content
├── ecosystem.json               # Editor & tools ecosystem
├── skills-data.json             # SKILL.MD directory data
├── blog/                        # Blog posts (markdown)
├── designs/                     # DESIGN.MD entries (markdown)
├── mcps/                        # MCP server entries (markdown)
└── spotlights/
    ├── jpacli-features.json     # JPA CLI features carousel
    ├── showcase.json            # Showcase carousel (stats, ecosystem)
    └── touchpoint.json          # Contact info carousel
```

## Admin CMS

Access the admin panel at `/admin`. The CMS has 6 sections:

1. **Home** — Landing page settings (hero, site global)
2. **JPA CLI** — JPA CLI application content
3. **Blog** — Blog articles and tutorials
4. **Skill** — SKILL.MD file listings
5. **Design** — DESIGN.MD template listings
6. **MCP** — MCP server listings

## Environment Variables (Netlify)

Set these in Netlify dashboard > Site settings > Environment variables:

```
GITHUB_OAUTH_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_OAUTH_CLIENT_SECRET=<your-github-oauth-client-secret>
SITE_URL=https://jpa.my.id
```

## License

MIT
