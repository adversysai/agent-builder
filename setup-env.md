# Open Agent Builder Setup Guide

## Step 1: Create .env.local file

Create a `.env.local` file in your project root with the following content:

```bash
# Open Agent Builder Environment Variables

# ===========================================
# REQUIRED VARIABLES (Must be set)
# ===========================================

# Convex Database (will be generated during setup)
# NEXT_PUBLIC_CONVEX_URL=your-convex-url-here

# Clerk Authentication (will be set up during setup)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

# Firecrawl API (REQUIRED - you already have this!)
FIRECRAWL_API_KEY=fc-31626d3c0dc84a909a3280f1639414a0

# ===========================================
# OPTIONAL VARIABLES (Can be added via UI)
# ===========================================

# LLM Providers (you already have these!)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Optional: E2B for sandboxed code execution
# E2B_API_KEY=e2b_...
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set up Convex Database

```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex project
npx convex dev
```

This will:
- Open your browser to create/link a Convex project
- Generate a `NEXT_PUBLIC_CONVEX_URL` in your `.env.local`
- Start the Convex development server

## Step 4: Set up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a new application
2. In your Clerk dashboard:
   - Go to **API Keys**
   - Copy your keys
3. Go to **JWT Templates** → **Convex**:
   - Click "Apply"
   - Copy the issuer URL

Add these to your `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

## Step 5: Configure Convex Authentication

Edit `convex/auth.config.ts` and update the domain:
```typescript
export default {
  providers: [
    {
      domain: "https://your-clerk-domain.clerk.accounts.dev", // Your Clerk issuer URL
      applicationID: "convex",
    },
  ],
};
```

Then push the auth config to Convex:
```bash
npx convex dev
```

## Step 6: Launch the Application

```bash
# Terminal 1: Convex dev server (if not already running)
npx convex dev

# Terminal 2: Next.js dev server
npm run dev
```

Or run both with one command:
```bash
npm run dev:all
```

Visit [http://localhost:3000](http://localhost:3000)

## What You Already Have ✅

- ✅ Firecrawl API key
- ✅ Anthropic API key  
- ✅ OpenAI API key
- ✅ Node.js (assuming you have it)

## What You Still Need to Set Up

- ⏳ Convex database account and URL
- ⏳ Clerk authentication account and keys
- ⏳ Configure the auth integration
