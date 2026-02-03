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

- Sign up and Create project/App in [Sanity](https://www.sanity.io/)
- Once created Follow the Getting Started instructions
- Might ask to login for the first time, use the provider you used to sign up, for me Google/Gmail

### Sanity Schema and Sample Data (ndjson) NewLine Delimited JSON

- Create schemas in `/sanity/schemaTypes/customerTypes.ts` or any other Schema you want
- Don't forget to install sanity icon `pnpm add @sanity/icons`
- Create required schemas: `categoryType.ts`, `productType.ts`, `orderType.ts` in the `/sanity/schemaTypes` and importing them in `/sanity/schemaTypes/index.ts` file so that schema is reflected in the sanity studio
- Also create TypeScript Types for Object Structure and Type Safety in the `/lib/constants`
  - here is all the product materials, colors, status, and advanced TS structure for schemas.
  - Once all the schema and Types are ready populate/upload to cloud (dataset) the sample data from `sample-data.ndjson`
  - `pnpm dlx sanity dataset import sample-data.ndjson production --replace` OR
  - `npx sanity@latest dataset import sample-data.ndjson production --replace`

  💡 Pro Tip: ndjson is more efficient compare to json when streaming: uploading or downloading data.

#### Time to use data in project

- inside `/sanity/lib/live.ts` you have `sanityFetch` and `SanityLive`.
- place the `<SanityLive /> in` `(app)/layout.ts` so that any changes in sanity is live or real time without refresh

```JS
import { SanityLive } from "@/sanity/lib/live"
import { ClerkProvider } from "@clerk/nextjs"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <main>{children}</main>
      <SanityLive />
    </ClerkProvider>
  )
}
```

- `sanityFetch()` is used to query or fetch the data.
- `defineQuery()` using `next-sanity` in `/lib/sanity/queries`
  - checkout for reference and full understanding
- Once all the schemas and queries are created its time to create TypeScript or Type Safety for every schema and fetch queries resonse. [Super helpful while development]
- run `sanity schema extract && sanity typegen generate --enforce-required-false` OR
- simply create new script in `package.json` file as

```JS
{...
    scripts: {
        ...
        "typegen": "sanity schema extract && sanity typegen generate --enforce-required-false"
    }
}
```

- you might need to install `@sanity/client` if not installed, for types.d.ts

- When you run `pnpm typegen` or `npm run typegen`, Sanity looks at your Schemas (what the data should look like) and your GROQ Queries (what data you are asking for) and automatically writes a massive TypeScript file for you.
- What really happens
  - `sanity schema extract`:
    - Scans your schemaTypes folder (Product, Order, etc.).
    - Generates a hidden schema.json file.
    - It takes your "code-based" schemas and turns them into a static "blueprint" that the generator can read.
  - `sanity typegen generate`:
    - Reads the schema.json AND scans all your .ts files for GROQ queries wrapped in defineQuery.
    - Creates a sanity.types.ts file containing every TypeScript interface (e.g., Product, Category, Order).
  - `--enforce-required-false`:
    - Forces all generated TypeScript properties to be Optional (?), even if they are marked as required() in the Sanity Studio.
    - Safety. It forces you to use Optional Chaining (product?.name) to prevent your site from crashing when viewing Drafts or Old Data that might be missing fields.

## Add ShadeCn

- Follow instruction [Nexjs Shadcn](https://ui.shadcn.com/docs/installation/next)
- Install `pnpm dlx shadcn@latest init`

## Adding Stripe

- Create Stripe account and project/business and get the STRIPE_SECRET_API_KEY into .env
- install stripe: `pnpm add stripe` || `npm i stripe`
- create stripe function like `stripe.customer.create()` and `stripe.checkout.sessions.create()` or get based on need
  - use the `/lib/actions` for reference, fully explained and commented
- also add `writeClient` in `/sanity/lib/client` for sanity doc/db mutation as during checkout product stock and user details need to update.
- **Now if you check out it will create new customer in stripe business and link it/update in db with stripe id**
- <i>But this will not create order in your db<i> Why? Because:
  - CheckoutFunction only redirect user to Stripe portal and done.
  - It doesn't wait for user to enter their details and get the payment.completed because that would be synchronous which stops server from doing other task.
  - So we add sucess_url and cancel_url: if payment sucess stripe redirect to sucess_url else to cancel_url
- Once the payment is sucess, stripe sends the `checkout.session.completed` event which trigger our webhook (if you set one) and that webhook trigger our `{domain_url}/api/webhooks/stripe`.
  - once webhook sends the request it sends header with its secret to verify the request is what really coming from authorized source i.e, webhook
  - then we write the lock to destrcture the even -> session -> check or even.type -> if success then update order and product quantity/stock.

To get the local webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

- if its failed then you need to instal stripe cli `brew install stripe/stripe-cli/stripe`, which lets say local stripe server for webhook
- once stripe download, login with stripe account - one time
- or just `stripe listen --forward-to localhost:3000/api/webhooks/stripe` which gives opt in gmail and authorize it
- and then run again and copy `whsec_...` into env as STRIPE_WEBHOOK_SECRET
- make sure to put api login in `{domain_url}/api/webhooks/stripe`
- You will get `200` status if sucess.
