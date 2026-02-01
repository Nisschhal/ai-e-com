## Create Next Project

## Setup Clerk for Authentication

- Setup Clerk Project [Link](https://clerk.com/)
- Once App is create follow the given instructions:
  - `pnpm add @clerk/nextjs`
  - copy api keys to .env
  - add `proxy.ts` aka `middleware`
  - add `ClerkProvider` to layout.ts
- Add custom protected or Public Route in `proxy.ts` for propery authorization
- Checkout `proxty.ts` for more info on how to do.
- or [Follow Clerk doc](https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page)

## Sanity for Backend CMS

- Create project/App in [Sanity](https://www.sanity.io/)
