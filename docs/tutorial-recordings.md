# Tutorial recording checklist

The floating **Tips & Tricks** button offers three guides for the viewer’s role. Initial suggestions relate to the current page; **More topics** shuffles that role’s topics. **All guides** opens the Help page, which lists both audiences. The button stays out of authentication, payment, and chat screens.

Every topic has a written guide now. Videos are optional and only appear after their filename is enabled in `src/data/tutorials.ts`. Playback has controls and sound support, does not autoplay, and falls back to the written instructions if the video cannot load.

## Record these first

Aim for 45–90 seconds per task. Use a clean demo account, zoom enough for labels to be readable on mobile, and finish by showing the resulting screen. Captions or visible annotations will help viewers follow along without sound. Avoid showing personal details or payment credentials.

| Priority | Audience | Recording | Show in the clip | S3 key |
| --- | --- | --- | --- | --- |
| 1 | Pet owner | Book a pet service | Services → service details → Book Now → pet if required → available date and time slot → review total/coupon → Confirm Booking → Booking History | `tutorials/pet-owner/book-service.mp4` |
| 1 | Pet owner | Add a pet profile | My Profile → My Pets → Add Pet → details/photo → save → saved pet | `tutorials/pet-owner/add-pet.mp4` |
| 1 | Pet owner | Top up Furkredits | My Profile wallet → Top up → amount/conversion → checkout → return → wallet/Transaction History | `tutorials/pet-owner/top-up-furkredits.mp4` |
| 2 | Merchant | Add and edit a service | Dashboard → Add New Service → category/details/price/duration/pet requirement/images → save → Manage Services → edit | `tutorials/merchant/manage-services.mp4` |
| 2 | Merchant | Set business and break hours | Profile → Business Hours → edit → times/closed day → save → Break Hours → edit → add break → save | `tutorials/merchant/business-hours.mp4` |
| 2 | Merchant | Manage a booking | Bookings → details → Confirm Booking → Start Service → Complete Service; also demonstrate Scan Booking QR with a demo pet or owner QR | `tutorials/merchant/manage-bookings.mp4` |

Record payment and booking changes only in an approved test environment with demo data.

## Remaining clips

| Audience | Recording | Show in the clip | S3 key |
| --- | --- | --- | --- |
| Pet owner | Track a booking and find your QR | Booking History status/schedule → My Pets pet QR → Profile Pet Owner QR; explain which QR to show | `tutorials/pet-owner/track-booking.mp4` |
| Pet owner | Message a merchant | Service details → Message Merchant → send question → return to Messages/floating chat | `tutorials/pet-owner/message-merchant.mp4` |
| Merchant | Submit verification | Merchant Verification → merchant type/details/address → required uploads → Submit for Verification → application status | `tutorials/merchant/merchant-verification.mp4` |
| Merchant | Update merchant profile | Profile → edit business/contact/address details → save → updated profile | `tutorials/merchant/merchant-profile.mp4` |
| Merchant | Check earnings | Payouts → month selection → Monthly Earnings → search → earning record/service link | `tutorials/merchant/merchant-earnings.mp4` |
| Pet owner | Furkoins and rewards | Wallet Furkoins balance → Reward Tiers → explain Furkoins versus Furkredits | `tutorials/pet-owner/furkoins-and-rewards.mp4` |

**Hold the “How to redeem Furkoins” recording.** The current frontend has no active redemption action: the buttons in `RewardsRedemption.tsx` are commented out. The guide accurately says in-app redemption is unavailable. Once a redemption flow exists, update the guide and record the actual merchandise selection and confirmation process. The current balance/tier overview may be recorded separately in the meantime.

## Connect an uploaded clip

1. Upload the MP4 under the listed `tutorials/` key in the existing tutorial assets location. H.264 video with AAC audio is a practical browser-compatible format.
2. In `src/data/tutorials.ts`, uncomment the corresponding entry in `tutorialVideoFiles`, for example:

   ```ts
   'book-service': 'pet-owner/book-service.mp4',
   ```

3. The viewer uses the existing `VITE_CDN_URL` plus `/tutorials/` and that filename. Do not include the `tutorials/` prefix twice, use an `s3://` URL, put credentials in the frontend, or store an expiring signed URL in the catalog. Serve the asset over the existing HTTPS CDN path.
4. Check the clip’s access and playback in the approved development environment. If it is not ready, leave the mapping commented out; the written guide continues to work without requesting a missing clip.

Existing `.webp` walkthroughs used by `GuidedTour.tsx` stay in place. These new MP4 recordings are separate assets.

## Offline checks

From `furk-web-v2/`, run `node --test tests/tutorials.test.mjs` for the catalog, role isolation, page suggestions, and optional video URLs. Run `npm run lint`, `npx tsc -b`, and `npm run build:dev` for the normal project checks. No AWS or database connection is needed for these checks.
