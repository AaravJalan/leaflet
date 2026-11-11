# Leaflet

A public board for org announcements. An organizer posts a time, place, and details, then shares one link. Other people follow orgs and read them in one place.

Live site: https://leaflettt.web.app  
Firebase project: `leaflet-30729` (Hosting site `leaflettt`)

This is not `cs392-react-challenges`. Do not deploy Leaflet at that project.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` if you do not have one. `.env` is gitignored. Share it with teammates directly. Do not commit it.

Auth needs Email/Password and Google turned on, and `localhost` plus `leaflettt.web.app` in Authentication authorized domains.

## Deploy

```bash
npm run deploy
```

Rules only:

```bash
firebase deploy --only firestore:rules
```

Local `npm run dev` is ahead of the live site until the next deploy.

## How it works

Nav: Feed, Orgs, Account.

Feed and Orgs have three filters: All, Following, My orgs. Following does not include orgs you created or posts you wrote.

Settings has one account type:

- Organizer: create orgs. Cannot subscribe.
- Volunteer: read and subscribe. Cannot create orgs. Cannot subscribe to an org you created.
- Both: create orgs and subscribe to other people's orgs.

The person who created an org can always post. They can add other Leaflet accounts as posters, on the create form and on the org page. The dropdown only lists accounts that exist (sample accounts, plus anyone who has signed up). The same account cannot be added twice.

Marks are icons only:

- House: you created the org
- Pencil: you can post, but you did not create it
- Bookmark: you follow it
- Star: created in the last day

Signed in, announcement cards show the poster's name. Signed out, names and "you" are hidden.

Announcements can be one time, or weekly for a chosen week and weekdays. The poster can edit or delete them. The org owner can edit or delete the org.

## Sample data

A few shared sample orgs and posts always show for everyone. They are owned by demo accounts (Jordan, Priya, Sam), not by whoever is signed in. New accounts start with no orgs, posts, or follows of their own.

## Routes

| Path | Page |
| --- | --- |
| `/` | Feed |
| `/announcements` | All / Following / My orgs |
| `/orgs` | All / Following / My orgs |
| `/activity` | Access changes, orgs you can post to, your posts |
| `/auth` | Sign in / sign up (email or Google) |
| `/settings` | Account type |
| `/orgs/new` | Create org |
| `/org/:orgId` | Org |
| `/org/:orgId/edit` | Edit org |
| `/org/:orgId/new` | New announcement |
| `/a/:announcementId` | Announcement |
| `/a/:announcementId/edit` | Edit announcement |

`/browse` goes to `/orgs`. `/me` goes to My orgs. `/inbox` goes to Following announcements.

## Firestore

| Path | What |
| --- | --- |
| `users/{uid}` | email, display name, account type |
| `users/{uid}/activity/{id}` | someone allowed or removed posting |
| `organizations/{orgId}` | name, type, location, owner |
| `organizations/{orgId}/members/{uid}` | extra posters |
| `announcements/{id}` | post, schedule, author |
| `subscriptions/{uid_orgId}` | follows |

A signed-in user can create an org when `ownerId` is their uid. There is no verified flag.

## Not built

- Email when something is posted. "Inbox" in the homepage line is the Following filter, not mail.
- RSVP
- Push notifications
- A map
