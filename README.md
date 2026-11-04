# Leaflet

Community announcement board for organizers who do not want to run a website, group chat, or mailing list.

**Jordan** posts a neighborhood update (time, place, details, optional link) and shares one URL. **Alex** browses orgs, opens the cleanup leaflet, and subscribes — no BCC, no Gmail-sheet workflow.

Live hosting (when deployed): https://leaflettt.web.app  
Firebase project: **leaflet** (project ID: `leaflet-30729`)  
(Separate from `cs392-react-challenges` — teammates only touch this project.)

---

## Stack

- React 19 + TypeScript + Vite
- Firebase Auth (email/password + Google)
- Cloud Firestore + security rules + indexes
- Firebase Hosting (`leaflettt` site)

---

## What’s done

### Product / UX
- [x] Public feed of announcements (All / Following when signed in)
- [x] Browse organizations by name + type filter
- [x] Org detail page with subscribe / unsubscribe
- [x] Create organization
- [x] Create announcement (title, details, when, where, optional link)
- [x] Shareable announcement pages at `/a/:id` with copy-link
- [x] My orgs page (owned orgs + followed orgs)
- [x] Auth: email sign up / sign in + Continue with Google
- [x] Hide **Post** in the nav until signed in
- [x] “Load sample orgs & posts” seed button (signed-in users)
- [x] Modern green UI (rounded rectangles, Figtree, hover states)

### Firebase / infra
- [x] `.env` wired for Firebase project **leaflet** (`leaflet-30729`)
- [x] `.firebaserc` + `firebase.json` (Hosting site `leaflettt`, SPA rewrites)
- [x] Firestore rules + composite indexes deployed at least once
- [x] Hosting deploy path: `npm run deploy`

### Data model (Firestore)
| Collection | Purpose |
| --- | --- |
| `users/{uid}` | Profile (`email`, `displayName`, …) |
| `organizations/{orgId}` | Org metadata (`name`, `type`, `ownerId`, `verified`, …) |
| `announcements/{id}` | Posts tied to an org |
| `subscriptions/{uid_orgId}` | User follows an org |

### Routes
| Path | Page |
| --- | --- |
| `/` | Feed + sample-data card |
| `/browse` | Search / filter orgs |
| `/auth` | Sign in / sign up |
| `/me` | My orgs + following |
| `/orgs/new` | Create org |
| `/org/:orgId` | Org page |
| `/org/:orgId/new` | New announcement |
| `/a/:announcementId` | Shareable announcement |

---

## In progress / partially started (not finished in UI)

These pieces were started in code but are **not fully wired end-to-end** yet:

- [ ] **Account roles with checkboxes** — `isVolunteer` / `isOrganizer` exist on `UserProfile` + `updateUserRoles()`, but Auth / settings UI does not let users pick them yet
- [ ] **Co-organizers** — `organizations/{orgId}/members/{uid}` service + draft rules exist; org creators cannot yet invite organizers by email in the UI
- [ ] **Post permission** — app still mostly treats “owner only” as the poster; rules/services for “owner OR selected organizer” need finishing and redeploy
- [ ] **Verified ✓** — orgs still show a text “Verified” chip; should become a clear checkmark, and “verified” meaning should be defined (auto vs manual)
- [ ] **Firestore permissions error** — “Missing or insufficient permissions” when seeding/posting usually means rules rejected the write (signed-out, rules out of date, or create payload didn’t match rules). Redeploy rules after role/member changes:  
  `firebase deploy --only firestore:rules`

---

## What should be done next

### Must-have (core product)
1. **Role onboarding (checkboxes)**  
   On sign-up and on `/me` (or a settings panel):  
   - ☐ I want to volunteer / follow community work  
   - ☐ I want to organize / post for groups  
   Users can pick one or both. Gate “Create org” / **Post** behind `isOrganizer` (or allow create then prompt).

2. **Who can post**  
   - Creator of the org can always post  
   - Creator can add other signed-up users as organizers (email lookup → `members` doc)  
   - Only owner + those organizers see **New announcement**  
   - Update Firestore rules + UI together, then redeploy rules

3. **Verified checkmark**  
   Replace the chip with a ✓ next to the org name. Decide policy:  
   - MVP: every created org is verified (current behavior), or  
   - Later: admin / email-domain verification

4. **Fix seed / permissions**  
   Confirm user is signed in → click **Load sample orgs & posts** → if it still fails, redeploy rules and check browser console for the exact denied path.

5. **Redeploy the latest UI** to Hosting when ready:  
   `npm run deploy`  
   (Local `npm run dev` is ahead of https://leaflettt.web.app until you deploy again.)

### Nice-to-have
- Email / push digests for subscribers (Cloud Functions)
- RSVP without exposing emails
- Stronger verification workflow
- Map / location discovery
- Prevent duplicate sample seeds
- Delete / edit announcements

---

## How people decide what to do (intended UX)

| Person | Path |
| --- | --- |
| Neighbor / volunteer | Sign in → check **Volunteer** → Browse → Subscribe → read feed / shared `/a/...` links |
| Organizer | Sign in → check **Organizer** → Create org → Post announcement → share link |
| Both | Check both boxes; follow some orgs and run others |
| Co-organizer | Org creator adds their email under org settings → they can post for that org only |

**“Verified”** means the org is tied to a real account (and later, stronger checks). It is not the same as “volunteer” vs “organizer.”

---

## Local setup

1. Firebase Console → enable **Email/Password** and **Google** sign-in.  
2. Ensure Firestore exists; deploy rules/indexes if needed.  
3. Config:

```bash
cp .env.example .env   # already filled for this project if .env exists
npm install
npm run dev            # http://localhost:5173 (or next free port)
```

Required `.env` keys:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Deploy

```bash
npm run deploy
# or:
npm run build && firebase deploy
```

Firestore only:

```bash
firebase deploy --only firestore
```

---

## Storyboard coverage

1. Jordan needs to announce without a website / mailing list → create org + post.  
2. Jordan shares `/a/...`.  
3. Alex browses local events / orgs.  
4. Alex finds the cleanup, subscribes, stays in the loop.

---

## Known issues

- Empty feed until someone posts or clicks **Load sample orgs & posts** (must be signed in).  
- Sample data is owned by whoever seeds it.  
- Production Hosting may lag local UI until the next deploy.  
- Role / co-organizer work is incomplete — see “In progress” above.
