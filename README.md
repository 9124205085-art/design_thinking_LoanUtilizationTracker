# LoanTrack

A mobile-first app that helps a student show the bank how an education loan was used. Every bill stays on the phone, with a photo, a purpose check, and a PDF the bank can read.

There is no login and no server. The phone saves the loan, the bills, and the photos in local storage.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:5173

On the first screen, tap **Load example data**. That fills a ₹5,00,000 SBI education loan with sample bills, one flagged movie ticket, and one bill without a photo.

## Open it on your phone (same Wi-Fi)

```bash
npm run dev -- --host
```

Vite prints a **Network** address, for example `http://192.168.1.8:5173`. Type that into the phone's browser. The computer and the phone need to be on the same Wi-Fi. If Windows asks, allow Node through the firewall.

That Wi-Fi link is a normal `http` address. You can use the whole app on it. Two things need a secure `https` link instead:

- Adding the app to the home screen
- Saving location as proof

Photos from the camera still work on the Wi-Fi link.

## Try the installed app (offline)

```bash
npm run build
npm run preview -- --host
```

Open the localhost address on the same computer, or deploy it (below) and open the `https` link on the phone. Then use the browser menu and choose **Add to Home Screen** or **Install app**. After that, LoanTrack opens like an app and the screens still load without internet. Bills were already saved on the phone.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. Open the `https` link on your phone and install it.

The `vercel.json` file sends app routes such as `/expenses` to `index.html`, so refresh works on those screens.

## What to show in the presentation

1. **Load example data** on the setup screen.
2. Home shows the loan, the money left, the use score, and plan versus spending.
3. Tap the score circle. It is half "does this match the loan?", about a third "is there a photo?", and the rest "did this stay inside the plan?".
4. Open **Bills** and tap **PVR Cinemas**. It is marked Flagged.
5. The **Alerts** tab lists the laptop that went over the plan, the bill with no photo, the monthly payment coming up, and money that is still unused.
6. **Make a report for the bank** creates a PDF. Share uses the phone share sheet when the browser allows it.
7. Settings switches the labels between English, Tamil, and Hindi.
8. **Bank officer view (demo)** at `/bank` is a practice screen. It is not connected to a real bank.

## How the score works

```
score = 50% purpose-matched spending
      + 30% share of bills with a photo
      + 20% staying inside each category
```

A bill is flagged when the shop name or note contains a word that does not fit the loan (for an education loan: movie, restaurant, shopping, gaming, and similar words). The student can still save it. The app keeps the warning so they can explain it.

## Folder guide

- `src/pages` — each screen
- `src/components` — phone frame, buttons, score circle
- `src/lib` — score, alerts, purpose check, demo data, PDF
- `src/context/AppContext.tsx` — data saved on the phone
