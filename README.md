# jafardabbagh.com

Personal website for Jafar Dabbagh — built with Next.js 16, Tailwind CSS 4, and deployed on Vercel.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel
- **Domain**: jafardabbagh.com

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, about snippet, featured projects, recent posts |
| `/about` | Bio, skills, experience timeline |
| `/portfolio` | Projects grid with links |
| `/blog` | Writing / articles listing |
| `/contact` | Contact form + social links |

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy

Push to `main` — Vercel auto-deploys from GitHub. Connect your custom domain in the Vercel dashboard under **Domains**.

## Content Updates

All content lives in the page files under `src/app/`. Look for `[Replace this …]` placeholders to fill in your real content:

- `src/app/page.tsx` — hero tagline, featured projects, recent posts
- `src/app/about/page.tsx` — bio paragraphs, skills, experience, education
- `src/app/portfolio/page.tsx` — projects array at the top of the file
- `src/app/blog/page.tsx` — posts array at the top of the file
- `src/app/contact/page.tsx` — update email, social URLs, and Formspree ID

## Contact Form

The contact form uses [Formspree](https://formspree.io). Create a free account, get your form ID, and replace `YOUR_FORM_ID` in `src/app/contact/page.tsx`.
