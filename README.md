# Troika WhatsApp Sender

> **Troika International · Artful Passion**  
> A private, browser-only assisted promotional WhatsApp tool for Troika International bathware and sanitaryware dealers.

---

## What Is This Tool?

Troika WhatsApp Sender is a lightweight, private internal web app. Staff members use it to send promotional messages and a product photo to 50–200 existing dealers per campaign.

**How it works (Assisted, never automated):**
1. WhatsApp Web links (`wa.me`) can only pre-fill text. They cannot attach images automatically.
2. The app copies your promotional bathware picture to your clipboard as a PNG and opens the dealer's chat in WhatsApp Web.
3. You press `Ctrl+V` in WhatsApp Web to paste the picture, review the message, and click **Send** yourself.
4. You mark the dealer as sent and move to the next contact.

---

## 1. How to Put This Code on GitHub

You do not need to be a developer. Follow these steps:

1. **Create a GitHub account** at [github.com](https://github.com) if you do not have one.
2. Click the **+** icon in the top right corner and choose **New repository**.
3. Name your repository (for example: `troika-whatsapp-sender`).
4. Set the repository to **Private** (recommended for company tools) and click **Create repository**.
5. On your computer:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Troika WhatsApp Sender"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/troika-whatsapp-sender.git
   git push -u origin main
   ```
6. Your code is now safely backed up on GitHub.

---

## 2. How to Deploy on Cloudflare Pages (Free Plan)

Cloudflare Pages hosts static front-end apps for free with global speed and SSL security.

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. In the left navigation, click **Compute (Workers & Pages)** > **Create** > **Pages** > **Connect to Git**.
3. Authorize GitHub and select your `troika-whatsapp-sender` repository.
4. In the **Set up builds and deployments** screen, enter these exact settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank or default)
5. Click **Save and Deploy**.
6. Cloudflare will build the site in about 1 minute and give you a free address like `https://troika-whatsapp-sender.pages.dev`.

---

## 3. How to Protect the Site with Cloudflare Access (Zero Trust)

Because this is a private internal tool, protect it so only authorized Troika staff can view it. Cloudflare Zero Trust is **free for up to 50 users** and sends a secure one-time PIN code to staff email addresses.

### Step 1: Set Up Cloudflare Zero Trust
1. In your Cloudflare Dashboard, go to **Zero Trust**.
2. Go to **Access** > **Applications** > **Add an application** > **Self-hosted**.
3. **Application name**: `Troika WhatsApp Sender`.
4. **Application domain**: Enter your Pages domain (e.g. `troika-whatsapp-sender.pages.dev`) or your company custom domain.

### Step 2: Add an Access Policy
1. **Policy name**: `Troika Staff Only`.
2. **Action**: `Allow`.
3. Under **Configure rules**:
   - Selector: `Emails ending in`
   - Value: `@yourtroikadomain.com` (or choose `Emails` and list specific staff email addresses).
4. Save the policy. When staff open the site, Cloudflare prompts them for their email and sends a 6-digit login PIN.

> ⚠️ **CRITICAL SECURITY WARNING:**  
> Cloudflare Pages settings has a quick switch called *"Enable access policy"*. **Be careful:** that switch only protects preview/branch deployments, NOT the main production `pages.dev` address!  
> To protect your main production tool and any custom domain, you **MUST** configure the application policy directly in the **Cloudflare Zero Trust Dashboard** under **Access > Applications** as described above.

---

## 4. Step-by-Step: How to Run a Campaign

### Before You Start:
- Open WhatsApp Web in another tab in Chrome and ensure you are logged in.

### Step 1: Upload Your Dealer File
- Go to **New Campaign**.
- Drag and drop your dealer Excel file (`.xlsx`, `.xls`, or `.csv`).
- The app automatically finds the header row and maps the Name and Phone columns. If needed, click *"Adjust Detected Columns"* to change them.
- Check the table. Duplicates and invalid numbers are flagged automatically.
- Check or uncheck contacts as needed.

### Step 2: Compose Message & Choose Photo
- Enter a Campaign Name for internal tracking.
- Type your message. Use `{name}` where you want the dealer's business name to appear. If a name is missing, it automatically uses *"Sir/Madam"*.
- Drag and drop one promotional product image (JPG, PNG, WebP).

### Step 3: Verify the Checklist & Launch
- Check the 4 verification boxes.
- Click **"Test With My Own Number"** to verify the copy & chat experience with your personal phone first.
- Click **"Launch Assisted Send Desk"**.

### Step 4: Dispatch in the Send Desk
- For each dealer:
  1. Click **"Copy Image + Open WhatsApp Chat"** (or press `Space` / `Enter`). The image is copied to your clipboard as a PNG, and WhatsApp Web opens in a reused tab.
  2. In WhatsApp Web, press **`Ctrl+V`** to paste the image.
  3. Review the prefilled caption and press **Send** yourself.
  4. Return to Troika Sender and click **"Mark as Sent"** (or press `S`).
- Take breaks when prompted (after every 40 chats) to protect your WhatsApp account.
- If you need to stop, click **"Save Progress File"** to download a `.json` backup file. You can resume later via **"Resume from File"**.

### Step 5: Export Report & Wipe Memory
- Go to **Campaign Report**.
- Download your official audit report via **"Export to Excel"** or **"Export to CSV"**.
- Click **"Clear Campaign & Image Memory"** to erase all data from your computer's temporary memory.

---

## 5. How Privacy & Security Rules are Enforced in Code

1. **React Memory Only**: Dealer files, names, numbers, messages, and catalog images exist only in React component memory while the tab is open.
2. **Zero Storage of Contact Data**: Code explicitly forbids storing names, phones, or images in `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or browser Cache. Only tiny UI settings (e.g., cooldown seconds) use `localStorage`.
3. **No External Server / No APIs**: The app has no backend server and makes zero calls to Google Gemini, AI APIs, external analytics, or remote CDNs.
4. **Strict Content-Security-Policy (CSP)**: `public/_headers` contains:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';
   Referrer-Policy: no-referrer
   X-Content-Type-Options: nosniff
   X-Robots-Tag: noindex
   ```
   The rule `connect-src 'none'` prevents the browser from making any outgoing network requests.
5. **Spreadsheet Formula Injection Protection**: All CSV and Excel report exports prefix cells starting with `=`, `+`, `-`, `@`, or tab with `'` to prevent spreadsheet execution vulnerabilities.
6. **No Console Leaks**: Dealer data is never logged to `console.log`.
7. **Clean Memory Wipe**: Revokes all `blob:` URLs and dereferences arrays upon Reset.

---

## 6. How to Replace the Logo

In `src/components/LogoPlaceholder.tsx`, replace the monogram with your official logo:
```tsx
<img src="/troika-logo.png" alt="Troika International" className="h-9 w-auto" />
```
Place your `troika-logo.png` file directly inside the `/public/` directory.

---

## Running Locally

```bash
# Install dependencies
npm install

# Run automated tests
npm run test

# Start local dev server
npm run dev

# Build production static bundle
npm run build
```
