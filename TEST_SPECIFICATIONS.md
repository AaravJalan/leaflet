# Test Specifications

This document describes every automated unit test in the Leaflet codebase in plain language, using a **Given / When / Then** format.

- **Given** is the starting situation: what is on screen, what data is saved, and what is faked ("mocked").
- **When** is the action or event being tested.
- **Then** is the result the test expects.

**Shared setup for all tests:** The tests run in a simulated browser (jsdom). After every test, the screen is cleared, the browser's saved data (`localStorage`) is wiped, and all fakes are reset. Each test therefore starts with no saved data unless its "Given" column says otherwise.

**Parameterized tests:** Some tests run the same check over a list of inputs (`it.each`). Each input is listed as its own row.

| File | Tests |
| --- | ---: |
| `src/context/DemoContext.test.tsx` | 15 |
| `src/components/ScheduleFields.test.tsx` | 8 |
| `src/lib/orgAccess.test.ts` | 9 |
| `src/lib/helpers.test.ts` | 27 |
| `src/lib/edits.test.ts` | 10 |
| `src/lib/schedule.test.ts` | 77 |
| `src/services/catalog.test.ts` | 22 |
| `src/services/firestore.test.ts` | 23 |
| `src/services/announcements.test.ts` | 11 |
| **Total** | **202** |

---

## `DemoProvider` / `useDemo` — `src/context/DemoContext.tsx`

Test file: `src/context/DemoContext.test.tsx`

`DemoContext` holds the app's demo state, which is saved in the browser: followed orgs, extra posters, local posts, edits, and RSVPs. Unless noted, each test reads the hook `useDemo()` inside a `DemoProvider`.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| useDemo | throws outside the provider | `useDemo()` is used **without** a `DemoProvider` around it. Console error output is silenced. | Component mounts / renders | It fails with the error "useDemo must be used within DemoProvider". |
| follows | defaults to an empty follow list | No follows are saved. | Component mounts / renders | `follows` is an empty list. |
| follows | restores saved follows, including an empty list | Storage key `leaflet-follows` holds an empty list `[]`. | Component mounts / renders | `follows` is an empty list (the saved empty list is respected). |
| follows | drops old mock follows from storage | `leaflet-follows` holds `["mock-evanston", "real-org"]`. | Component mounts / renders | `follows` is `["real-org"]`, and storage is rewritten to `["real-org"]` (the old sample follow is removed). |
| follows | follows and unfollows, and persists it | `leaflet-follows` holds `[]`. | `setFollowing('a', true)` is called, then `setFollowing('a', false)`. | After following: `isFollowing('a')` is true and storage holds `["a"]`. After unfollowing: `isFollowing('a')` is false and storage holds `[]`. |
| follows | does not add a follow twice | `leaflet-follows` already holds `["a"]`. | `setFollowing('a', true)` is called again. | `follows` is still just `["a"]`, with no duplicate. |
| posters | adds a poster and replaces one with the same user id | No extra posters exist. | `addPoster` is called for user "a" named "First", then again for user "a" named "Second". | The org's `extraPosters` list holds a single entry, "Second". |
| posters | removes a poster and records the removal | No extra posters exist. | User "a" is added as a poster, then `removePoster('org', 'a')` is called. | `extraPosters.org` is empty, and `removedPosterIds.org` is `["a"]`. |
| posters | records a removal once | No removals exist. | `removePoster('org', 'a')` is called twice. | `removedPosterIds.org` is `["a"]`, with no duplicate. |
| posters | clears the removal when the person is added back | No removals exist. | User "a" is removed, then added back with `addPoster`. | `removedPosterIds.org` is empty, and `extraPosters.org` holds 1 entry. |
| posters | survives a reload | A fresh provider. | User "a" is added and user "b" is removed. Then a **second** provider is mounted (simulating a page reload). | The second provider still shows "a" as an extra poster and "b" as removed. |
| local posts | puts the newest first and replaces by id | No local posts exist. | `addLocalPost` is called for post "a" (title "old"), then post "b", then post "a" again (title "new"). | `localPosts` titles are `["new", "b"]`: the newest is first and the old copy of "a" is replaced. |
| local posts | falls back to no posts for corrupt storage | Storage key `leaflet-local-posts` holds broken JSON (`{`). | Component mounts / renders | `localPosts` is an empty list, and nothing crashes. |
| edits | bumps revision for each write so pages reload | A fresh provider with `revision` at 0. | Four writes are made: `saveOrg('o', {name: 'N'})`, `removeOrg('o2')`, `savePost('p', {title: 'T'})`, and `removePost('p2')`. | `revision` is 4. The saved org edit, hidden org, post edit, and hidden post can all be read back from storage. |
| rsvps | toggles going and saves it | No RSVPs exist. | `setGoing('a', true)` is called twice, then `setGoing('a', false)`. | At first `isGoing('a')` is false. After the two "going" calls, `rsvps` is `["a"]` (no duplicate) and storage key `leaflet-rsvps` holds `["a"]`. After cancelling, `isGoing('a')` is false and storage holds `[]`. |

---

## `ScheduleFields` component — `src/components/ScheduleFields.tsx`

Test file: `src/components/ScheduleFields.test.tsx`

`ScheduleFields` is the form section where a poster picks when an event happens: either **one time** (start and end date/time) or **weekly** (a week, days of the week, and times). Unless overridden, it is rendered with `schedule = 'once'`, all text values blank, no days selected, and a fake (mock) callback for every `on…` prop.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| ScheduleFields | shows start and end inputs for a one time post | Default props (`schedule = 'once'`). | Component mounts / renders | The "Starts" and "Ends" inputs are shown, and there is no "Week of" input. |
| ScheduleFields | shows week, day, and time inputs for a weekly post | `schedule = 'weekly'`. | Component mounts / renders | "Week of", "Start time", and "End time" inputs are shown, along with exactly 7 day checkboxes. There is no "Starts" input. |
| ScheduleFields | switches modes from the toggle | Default props. | The user clicks the "Weekly" button, then the "One time" button. | `onSchedule` is called with `'weekly'`, then with `'once'`. |
| ScheduleFields | reports datetime changes | Default props (one time). | The user sets "Starts" to `2026-11-09T18:30` and "Ends" to `2026-11-09T20:00`. | `onStartsAt` is called with `2026-11-09T18:30`, and `onEndsAt` is called with `2026-11-09T20:00`. |
| ScheduleFields | reports weekly field changes | `schedule = 'weekly'`. | The user sets "Week of" to `2026-11-09`, "Start time" to `18:00`, and "End time" to `19:00`. | `onWeekOf`, `onStartTime`, and `onEndTime` are called with those exact values. |
| ScheduleFields | adds a day | `schedule = 'weekly'`, with Monday (`1`) already selected. | The user clicks the "Sun" checkbox. | `onDays` is called with `[1, 0]` (Sunday is added). |
| ScheduleFields | removes a selected day | `schedule = 'weekly'`, with Monday (`1`) and Wednesday (`3`) selected. | The user clicks the "Mon" checkbox. | `onDays` is called with `[3]` (Monday is removed). |
| ScheduleFields | checks only the selected days | `schedule = 'weekly'`, with only Wednesday (`3`) selected. | Component mounts / renders | The "Wed" checkbox is checked and the "Thu" checkbox is not. |

---

## `useOrgAccess` hook — `src/lib/orgAccess.ts`

Test file: `src/lib/orgAccess.test.ts`

`useOrgAccess(orgId, ownerId)` decides what the signed-in user can do for an organization. It returns `yours` (they own it), `canPost`, and `following`.

**Shared Given:** Sign-in (`useAuth`), demo state (`useDemo`), and sample data are all faked. Before each test the user is signed in as `"me"`, with no extra posters, no removals, and no follows. A sample org called `"sample"` lists user `"listed"` as a poster.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| useOrgAccess | grants nothing when signed out | No one is signed in, although "org" is in the follow list. | The hook is run for "org" owned by "owner". | Returns `{ yours: false, canPost: false, following: false }`. |
| useOrgAccess | lets the owner post | Signed in as "me". | The hook is run for "org" owned by "me". | `yours` and `canPost` are both true. |
| useOrgAccess | does not let the owner be removed | Signed in as "me", and "me" is on the removed-posters list for "org". | The hook is run for "org" owned by "me". | `canPost` is still true, because owners cannot be removed. |
| useOrgAccess | denies an unrelated user | Signed in as "me", who has no role in "org". | The hook is run for "org" owned by "owner". | `yours` and `canPost` are both false. |
| useOrgAccess | allows an added poster | "me" was added as an extra poster for "org". | The hook is run for "org" owned by "owner". | `canPost` is true. |
| useOrgAccess | allows a poster listed on a sample org | Signed in as "listed", who is a built-in poster for "sample". | The hook is run for "sample" owned by "owner". | `canPost` is true. |
| useOrgAccess | lets removal override an added or listed poster | (1) "me" is both added and removed for "org". (2) "listed" is removed from "sample". | The hook is run for each case. | `canPost` is false in both cases. Removal wins. |
| useOrgAccess | scopes grants to the org | "me" is an extra poster for a **different** org, "other". | The hook is run for "org" owned by "owner". | `canPost` is false. Permission in one org does not carry over to another. |
| useOrgAccess | reports following | The user follows "org". | The hook is run for "org", then for "other". | `following` is true for "org" and false for "other". |

---

## Small helpers — `src/lib/slug.ts`, `src/lib/roles.ts`, `src/lib/posters.ts`, `src/lib/images.ts`, `src/lib/permissionLog.ts`

Test file: `src/lib/helpers.test.ts`

### `slugify` — `src/lib/slug.ts`

`slugify` turns a name into a URL-friendly "slug".

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| slugify | turns "Rogers Park Block Club" into "rogers-park-block-club" | Input text `Rogers Park Block Club`. | `slugify` is called. | Returns `rogers-park-block-club` (lowercase, spaces become dashes). |
| slugify | turns "  padded  " into "padded" | Input with extra spaces before and after. | `slugify` is called. | Returns `padded`, with the spaces trimmed. |
| slugify | turns "Arts & Culture!" into "arts-culture" | Input with symbols `&` and `!`. | `slugify` is called. | Returns `arts-culture`, with the symbols dropped. |
| slugify | turns "---already--dashed---" into "already-dashed" | Input with repeated and leading/trailing dashes. | `slugify` is called. | Returns `already-dashed`: dashes are collapsed and trimmed. |
| slugify | turns "Room 101" into "room-101" | Input containing digits. | `slugify` is called. | Returns `room-101`, with the digits kept. |
| slugify | turns "!!!" into "" | Input of only symbols. | `slugify` is called. | Returns an empty string. |
| slugify | turns "" into "" | Empty input. | `slugify` is called. | Returns an empty string. |
| slugify | caps the length at 48 characters | A 60-character string of "a". | `slugify` is called. | The result is exactly 48 characters long. |

### Roles — `src/lib/roles.ts`

`canOrganize` and `canFollow` check what an account type allows. `isNewOrg` checks whether an org was created in the last day.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| roles | organizer: organize true, follow false | Account type `organizer`. | `canOrganize` and `canFollow` are called. | They can organize but cannot follow. |
| roles | volunteer: organize false, follow true | Account type `volunteer`. | `canOrganize` and `canFollow` are called. | They cannot organize but can follow. |
| roles | both: organize true, follow true | Account type `both`. | `canOrganize` and `canFollow` are called. | They can organize and follow. |
| roles | null: organize false, follow false | No account type (`null`). | `canOrganize` and `canFollow` are called. | They can do neither. |
| roles | undefined: organize false, follow false | Account type is missing (`undefined`). | `canOrganize` and `canFollow` are called. | They can do neither. |
| roles › isNewOrg | is true only for less than a day | The clock is frozen at day 10. | `isNewOrg` is called with a creation time of exactly now, of just under one day ago, and of exactly one day ago. | It returns true, true, then false. An org is "new" only for less than 24 hours. |

### `uniquePosters` — `src/lib/posters.ts`

`uniquePosters` cleans up an org's list of posters (members who can post).

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| uniquePosters | keeps distinct members in order | Members "b" and "a" with different emails. | `uniquePosters` is called. | Returns `["b", "a"]`, unchanged and in order. |
| uniquePosters | excludes the owner | Members "owner" and "a", with owner id `owner`. | `uniquePosters` is called with the owner id. | Returns only `["a"]`. |
| uniquePosters | removes repeats by user id | Two entries for user "a" with different emails. | `uniquePosters` is called. | Returns `["a"]` once. |
| uniquePosters | removes repeats by email, ignoring case and whitespace | User "a" with `Sam@X.co` and user "b" with `  sam@x.co `. | `uniquePosters` is called. | Returns `["a"]`. The second is treated as the same person. |
| uniquePosters | does not treat blank emails as duplicates | User "a" with an empty email and user "b" with a whitespace-only email. | `uniquePosters` is called. | Returns `["a", "b"]`. Both are kept. |

### `coverImage` — `src/lib/images.ts`

`coverImage` picks the picture shown on a post.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| coverImage | prefers the real image | A post with an `imageUrl`. | `coverImage` is called. | Returns that exact image URL. |
| coverImage | uses a placeholder seeded by id when the image is blank | Post `p1` with an empty `imageUrl`. | `coverImage` is called. | Returns the placeholder `https://picsum.photos/seed/p1/800/400`. |
| coverImage | honors a custom size and encodes the id | Post id `a/b c` (contains a slash and a space), with size 100×50. | `coverImage` is called. | Returns `https://picsum.photos/seed/a%2Fb%20c/100/50`, with the id safely encoded. |
| coverImage | offers three distinct presets | The built-in `COVER_OPTIONS` list. | The list is checked. | It contains 3 different options. |

### `permissionLog` — `src/lib/permissionLog.ts`

The permission log is a saved history of "who was allowed to post where".

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| permissionLog | starts empty | Nothing saved. | `readPermissionLog` is called. | Returns an empty list. |
| permissionLog | puts the newest event first | Nothing saved. | Event "a" is saved, then event "b". | The log reads `["b", "a"]`. |
| permissionLog | replaces an event with the same id | Nothing saved. | Event "a" (time 1), event "b", then event "a" again (time 2) are saved. | The log reads `["a", "b"]`, and "a" has the newer time, 2. |
| permissionLog | returns empty for corrupt storage | Storage key `leaflet-permission-events` holds broken JSON. | `readPermissionLog` is called. | Returns an empty list, and nothing crashes. |

---

## Local edits and hidden items — `src/lib/edits.ts`

Test file: `src/lib/edits.test.ts`

These helpers save org and post edits, and the lists of hidden ("removed") orgs and posts, in the browser. They then apply them on top of loaded data.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| reading storage | uses empty defaults | Nothing saved. | The hidden orgs, hidden posts, org edits, and post edits are read. | The lists are empty (`[]`) and the edit maps are empty (`{}`). |
| reading storage | uses empty defaults for corrupt JSON | Hidden orgs and post edits hold broken JSON. | They are read. | Empty defaults are returned, and nothing crashes. |
| hiding | adds ids once | Nothing hidden. | `hideOrg('a')`, `hideOrg('b')`, then `hideOrg('a')` again. | Both the last call's result and the saved list are `["a", "b"]`, with no duplicate. |
| hiding | keeps posts and orgs separate | Nothing hidden. | `hidePost('a')` is called. | Hidden posts are `["a"]`, and hidden orgs remain empty. |
| saving edits | merges repeated edits to one org | No edits. | Org "a" is saved with `{name: 'New'}`, then with `{location: 'Evanston'}`. | Org "a"'s edits are `{name: 'New', location: 'Evanston'}`. |
| saving edits | leaves other orgs alone | No edits. | Org "a" is saved with name "A", and org "b" with name "B". | Both edits are stored separately. |
| saving edits | lets a later edit clear a post date with null | No edits. | Post "a" is saved with `{startsAt: 5, title: 'T'}`, then with `{startsAt: null}`. | Post "a"'s edits are `{startsAt: null, title: 'T'}`. The date is cleared and the title kept. |
| applyOrgs | filters hidden orgs and overlays edits | Org "gone" is hidden, and org "kept" is renamed to "Renamed". | `applyOrgs` runs on orgs "gone", "kept", and "other". | "gone" is removed, "kept" shows as "Renamed", and "other" is unchanged. |
| applyOrgs | does not mutate its input | Org "a" has a saved rename. | `applyOrgs` runs on an org object named "Original". | The original object still has the name "Original". |
| applyPosts | filters hidden posts and overlays edits | Post "gone" is hidden, and post "kept" has edits `{title: 'Renamed', startsAt: null}`. | `applyPosts` runs on posts "gone" and "kept". | Only "kept" is returned, with the title "Renamed" and no start date. |

---

## Scheduling and date formatting — `src/lib/schedule.ts`

Test file: `src/lib/schedule.test.ts`

These helpers handle event times for one-time and weekly posts. All dates are in the viewer's **local time**, and the suite is run in several time zones in CI. The reference week is **Mon Nov 9 to Sun Nov 15, 2026**. Weeks run Monday through Sunday.

### `WEEKDAYS`

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| WEEKDAYS | lists Monday first and Sunday last, using JS day numbers | The built-in `WEEKDAYS` list. | The list is checked. | The ids are `1,2,3,4,5,6,0` and the labels are Mon to Sun, in that order. |

### `mondayOf` — finds the Monday that starts a date's week

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| mondayOf | Monday stays put | Date `2026-11-09` (Monday). | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Tuesday | Date `2026-11-10`. | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Wednesday | Date `2026-11-11`. | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Thursday | Date `2026-11-12`. | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Friday | Date `2026-11-13`. | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Saturday | Date `2026-11-14`. | `mondayOf` is called. | Returns `2026-11-09`. |
| mondayOf | Sunday belongs to the week that started six days earlier | Date `2026-11-15` (Sunday). | `mondayOf` is called. | Returns `2026-11-09`, not the following Monday. |
| mondayOf | rolls back across a month boundary | Date `2026-10-01`. | `mondayOf` is called. | Returns `2026-09-28`. |
| mondayOf | rolls back across a year boundary | Date `2026-01-01`. | `mondayOf` is called. | Returns `2025-12-29`. |
| mondayOf | rolls back across a leap day | Date `2024-03-01`. | `mondayOf` is called. | Returns `2024-02-26`. |
| mondayOf | rolls back from a leap day | Date `2024-02-29`. | `mondayOf` is called. | Returns `2024-02-26`. |
| mondayOf | returns local midnight | Date `2026-11-12`. | `mondayOf` is called. | The result's time is exactly 00:00:00.000. |
| mondayOf | holds for every day across several years, including DST changes | Every day from Jan 1, 2024 for about 4 years (1,464 days), including daylight saving changes. | `mondayOf` is called for each day. | Each result is a Monday 0 to 6 days before the input, and running `mondayOf` again on the result returns the same Monday. |

### `dateInWeek` — places a weekday and time inside a given week

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| dateInWeek | places weekday 1 on 2026-11-09 | Week of Nov 9, Monday, 09:00. | `dateInWeek` is called. | The date is `2026-11-09`. |
| dateInWeek | places weekday 2 on 2026-11-10 | Week of Nov 9, Tuesday, 09:00. | `dateInWeek` is called. | The date is `2026-11-10`. |
| dateInWeek | places weekday 3 on 2026-11-11 | Week of Nov 9, Wednesday, 09:00. | `dateInWeek` is called. | The date is `2026-11-11`. |
| dateInWeek | places weekday 4 on 2026-11-12 | Week of Nov 9, Thursday, 09:00. | `dateInWeek` is called. | The date is `2026-11-12`. |
| dateInWeek | places weekday 5 on 2026-11-13 | Week of Nov 9, Friday, 09:00. | `dateInWeek` is called. | The date is `2026-11-13`. |
| dateInWeek | places weekday 6 on 2026-11-14 | Week of Nov 9, Saturday, 09:00. | `dateInWeek` is called. | The date is `2026-11-14`. |
| dateInWeek | places weekday 0 on 2026-11-15 | Week of Nov 9, Sunday, 09:00. | `dateInWeek` is called. | The date is `2026-11-15`. |
| dateInWeek | treats Sunday as the end of the week, not the start | Week of Nov 9, at 09:00. | Sunday and Saturday are compared. | Sunday comes after Saturday. |
| dateInWeek | gives the same result for any date inside the week | Friday 18:30, with the week given as Nov 9, 10, 12, 14, or 15. | `dateInWeek` is called for each. | All results equal the result for Nov 9. |
| dateInWeek | sets hours and minutes and clears seconds | Week of Nov 9, Wednesday, `18:45`. | `dateInWeek` is called. | The time is exactly 18:45:00.000. |
| dateInWeek | handles the first and last minute of the day | Week of Nov 9, Monday, at `00:00` and `23:59`. | `dateInWeek` is called. | Returns Nov 9 at 00:00 and Nov 9 at 23:59. |
| dateInWeek | rolls into the next month and year | Week of Sep 28, 2026 (Sunday), and week of Dec 29, 2025 (Saturday). | `dateInWeek` is called. | Returns `2026-10-04` and `2026-01-03`. |
| dateInWeek | rolls over a leap day | Week of Feb 26, 2024, on Thursday and on Friday. | `dateInWeek` is called. | Returns `2024-02-29` and `2024-03-01`. |
| dateInWeek | keeps the wall clock time on the Sunday of US spring forward | Week of Mar 2, 2026, Sunday at 10:15 (the day clocks jump forward). | `dateInWeek` is called. | The date is `2026-03-08` and the time is still 10:15. |
| dateInWeek | keeps the wall clock time on the Sunday of US fall back | Week of Oct 26, 2026, Sunday at 10:15 (the day clocks fall back). | `dateInWeek` is called. | The date is `2026-11-01` and the time is still 10:15. |
| dateInWeek | falls back to midnight for a blank or malformed time | Week of Nov 9, Tuesday, with the time `""`, `"abc"`, or `":"`. | `dateInWeek` is called for each. | Each returns Tuesday Nov 10 at 00:00. |
| dateInWeek | accepts an hour with no minutes | Week of Nov 9, Tuesday, with the time `"7"`. | `dateInWeek` is called. | The time is 7:00. |

### `toDateInput`, `toTimeInput`, `toDateTimeInput` — fill form inputs from saved times

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| toDateInput | formats a local date as YYYY-MM-DD | Nov 9, 2026, 18:30. | `toDateInput` is called. | Returns `2026-11-09`. |
| toDateInput | zero pads the month and day | Jan 5, 2026. | `toDateInput` is called. | Returns `2026-01-05`. |
| toDateInput | uses the local day at the edges of the day | Jun 15, 2026 at 00:00 and at 23:59. | `toDateInput` is called. | Both return `2026-06-15`. |
| toDateInput | returns an empty string for null | No time (`null`). | `toDateInput` is called. | Returns an empty string. |
| toDateInput | treats 0 as unset | Time value `0`. | `toDateInput` is called. | Returns an empty string. |
| toTimeInput | formats 24 hour local time | Nov 9, 2026, 18:30. | `toTimeInput` is called. | Returns `18:30`. |
| toTimeInput | zero pads hours and minutes | 9:05. | `toTimeInput` is called. | Returns `09:05`. |
| toTimeInput | formats midnight as 00:00 | Midnight. | `toTimeInput` is called. | Returns `00:00`. |
| toTimeInput | returns an empty string for null | `null`. | `toTimeInput` is called. | Returns an empty string. |
| toDateTimeInput | produces the format a datetime-local input expects | Jan 5, 2026, 9:05. | `toDateTimeInput` is called. | Returns `2026-01-05T09:05`. |
| toDateTimeInput | returns an empty string for null | `null`. | `toDateTimeInput` is called. | Returns an empty string. |

### `buildWhen` — turns form values into the saved schedule

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| buildWhen, one time | converts both datetime inputs to timestamps | One time, starting `2026-11-09T18:30` and ending `2026-11-09T20:00`. | `buildWhen` is called. | Returns a one-time schedule with no repeat days or week, plus the matching start and end timestamps. |
| buildWhen, one time | allows blank start and end | One time, with both fields blank. | `buildWhen` is called. | The start and end are both empty (`null`). |
| buildWhen, one time | allows a start with no end | One time, with only a start. | `buildWhen` is called. | The start is set and the end is empty. |
| buildWhen, one time | ignores leftover weekly fields after the user switches modes | One time, with a start set, plus leftover weekly values (a week, times, Mon/Wed). | `buildWhen` is called. | The repeat days are empty, the week is empty, and the start is the one-time value. |
| buildWhen, one time | round trips through toDateTimeInput for the edit form | One-time start `2026-03-08T10:15` (a DST day). | `buildWhen` runs, then its start is passed to `toDateTimeInput`. | Gives back exactly `2026-03-08T10:15`. |
| buildWhen, weekly | rejects a missing week | Weekly, with no week chosen. | `buildWhen` is called. | Fails with "Pick a week, at least one day, and a start time." |
| buildWhen, weekly | rejects a missing start time | Weekly, with no start time. | `buildWhen` is called. | Fails with the same message. |
| buildWhen, weekly | rejects a missing days | Weekly, with no days selected. | `buildWhen` is called. | Fails with the same message. |
| buildWhen, weekly | stores the Monday of the chosen week | Weekly, week given as Thursday Nov 12, on Friday at 09:00. | `buildWhen` is called. | The saved week is Monday Nov 9. |
| buildWhen, weekly | anchors start and end on the selected day | Weekly, week of Nov 9, Wednesday, 09:00 to 10:30. | `buildWhen` is called. | Starts Nov 11 at 9:00 and ends Nov 11 at 10:30. |
| buildWhen, weekly | anchors on the earliest day of the week regardless of click order | Weekly, days picked as Fri, Tue, Thu. | `buildWhen` is called. | The start falls on Tuesday, Nov 10. |
| buildWhen, weekly | anchors after the weekdays when Sunday is also selected | Weekly, days Sun and Sat. | `buildWhen` is called. | The start falls on Saturday, Nov 14. Sunday counts as the end of the week. |
| buildWhen, weekly | anchors on the last day of the week when only Sunday is selected | Weekly, only Sunday. | `buildWhen` is called. | The start falls on Sunday, Nov 15. |
| buildWhen, weekly | leaves the end null without an end time | Weekly, with no end time. | `buildWhen` is called. | The end is empty. |
| buildWhen, weekly | keeps every selected day, in the order given | Weekly, days Fri, Mon, Sun. | `buildWhen` is called. | The saved repeat days are Fri, Mon, Sun, and the input list is unchanged. |
| buildWhen, weekly | ignores leftover one time fields | Weekly, plus leftover one-time dates from 2020. | `buildWhen` is called. | Starts Mon Nov 9 at 9:00 with no end. The 2020 values are ignored. |
| buildWhen, weekly | round trips through the edit form helpers | Weekly, week given as Nov 12, Thursday, 18:05 to 19:40. | `buildWhen` runs, then its results are passed to `toDateInput` and `toTimeInput`. | Gives back the week `2026-11-09`, `18:05`, and `19:40`. |
| buildWhen, weekly | formats back to what the user picked | Weekly, week of Nov 9, Fri and Mon, 18:00 to 19:30. | `buildWhen` runs, then `formatWhen`. | The text reads "Week of Nov 9, Mon, Fri, 6:00 PM to 7:30 PM". |

### `formatWhen` — the human-readable "when" text on a post

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| formatWhen, one time | shows only the start when there is no end | One time, starting Nov 9 at 18:30. | `formatWhen` is called. | The text reads "Mon, Nov 9, 6:30 PM". |
| formatWhen, one time | shows the full date on both sides of a range | Nov 9, 18:00 to 20:00. | `formatWhen` is called. | The text reads "Mon, Nov 9, 6:00 PM to Mon, Nov 9, 8:00 PM". |
| formatWhen, one time | distinguishes an end on a different day | Nov 9 at 22:00 to Nov 10 at 01:00. | `formatWhen` is called. | The text reads "Mon, Nov 9, 10:00 PM to Tue, Nov 10, 1:00 AM". |
| formatWhen, one time | distinguishes an end in a different month | Oct 31 at 22:00 to Nov 1 at 01:00. | `formatWhen` is called. | The text reads "Sat, Oct 31, 10:00 PM to Sun, Nov 1, 1:00 AM". |
| formatWhen, one time | formats midnight and noon on a 12 hour clock | Starts at 00:00, and starts at 12:00. | `formatWhen` is called. | The texts read "12:00 AM" and "12:00 PM". |
| formatWhen, one time | is empty with no start | No times set. | `formatWhen` is called. | Returns an empty string. |
| formatWhen, one time | is empty when only an end exists | Only an end time. | `formatWhen` is called. | Returns an empty string. |
| formatWhen, weekly | shows week, days, and time range | Weekly, week of Nov 9, Mon, 18:00 to 19:30. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon, 6:00 PM to 7:30 PM". |
| formatWhen, weekly | omits the range without an end | Weekly, with no end. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon, 6:00 PM". |
| formatWhen, weekly | sorts days Monday to Sunday | Days given as Sun, Fri, Mon, Wed. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon, Wed, Fri, Sun, 6:00 PM". |
| formatWhen, weekly | does not mutate repeatDays while sorting | Days list `[Sun, Mon]`. | `formatWhen` is called. | The original list is still `[Sun, Mon]`. |
| formatWhen, weekly | says Weekly when there is no week | Weekly, with no week. | `formatWhen` is called. | The text reads "Weekly, Mon, 6:00 PM". |
| formatWhen, weekly | omits the time when there is no start | Weekly, with no start. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon". |
| formatWhen, weekly | drops an end that has no start | Weekly, with an end but no start. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon". |
| formatWhen, weekly | skips day ids it does not know | Days Mon and an invalid id `9`. | `formatWhen` is called. | The text reads "Week of Nov 9, Mon, 6:00 PM". |
| formatWhen, weekly | falls back to the one time format with no repeat days | Weekly, with no days. | `formatWhen` is called. | The text reads "Mon, Nov 9, 6:00 PM". |
| formatWhen, weekly | tolerates older records with no repeatDays field | An older weekly record with no `repeatDays` field at all. | `formatWhen` is called. | The text reads "Mon, Nov 9, 6:00 PM", and nothing crashes. |

---

## Catalog loading — `src/services/catalog.ts`

Test file: `src/services/catalog.test.ts`

The catalog combines three sources of orgs and announcements: **remote** data from the Firestore database, **local** posts saved in the browser, and built-in **shared samples**. It also applies local edits and hidden items.

**Shared Given:** The Firestore lookups are faked. By default they return nothing (empty lists, or "not found"). The sample data has one org, "Middle Sample" (`mock-org`, owner `mock-jordan`, created at 7), and one post, `mock-post` (created at 50).

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| loadOrganizations | merges remote and shared sample orgs, sorted by name | Remote orgs "Zebra" and "Apple". | `loadOrganizations()` is called. | Returns "Apple", "Middle Sample", "Zebra", sorted A to Z. |
| loadOrganizations | still shows shared samples when Firestore fails | The remote lookup fails ("offline"). | `loadOrganizations()` is called. | Returns only "Middle Sample", without an error. |
| loadOrganizations | filters by type | Remote org "Apple" of type Volunteer. | `loadOrganizations({type: 'Campus'})` is called. | Returns only "Middle Sample" (type Campus). |
| loadOrganizations | treats type All as no filter | Remote org "Apple" of type Volunteer. | `loadOrganizations({type: 'All'})` is called. | Returns "Apple" and "Middle Sample". |
| loadOrganizations | searches names and descriptions, ignoring case | Remote orgs "Apple" (description "fruit stand"), "FRUIT Co", and "Cherry" ("tree"). | `loadOrganizations({search: '  fruit '})` is called. | Returns "Apple" and "FRUIT Co". |
| loadOrganizations | applies hidden orgs and saved edits | Remote orgs "Apple" and "Banana". "Apple" is hidden, and "Banana" is renamed "Blueberry". | `loadOrganizations()` is called. | Returns "Blueberry" and "Middle Sample". |
| loadOrganization | finds a shared sample without calling Firestore | No setup. | `loadOrganization('mock-org', ...)` is called. | Returns the sample org (owner `mock-jordan`), and Firestore is not contacted. |
| loadOrganization | returns null for a hidden org without calling Firestore | Org "a" is hidden. | `loadOrganization('a', ...)` is called. | Returns nothing (`null`), and Firestore is not contacted. |
| loadOrganization | applies edits to a remote org | Remote org "Apple" (id "a") with a saved rename to "Avocado". | `loadOrganization('a', ...)` is called. | The returned name is "Avocado". |
| loadOrganization | returns null for missing or failed lookups | First the remote org is not found, then the lookup fails. | `loadOrganization('a', ...)` is called in each case. | Returns `null` both times. |
| loadAnnouncements | merges local, remote, and shared sample posts newest first | Remote post "r" (time 100) and local post "l" (time 200). | `loadAnnouncements('me', [local])` is called. | Returns `l`, `r`, `mock-post`, newest first. |
| loadAnnouncements | keeps one copy of a repeated id, preferring the newer | Remote post "x" (title "remote", time 100) and local post "x" (title "local", time 200). | `loadAnnouncements` is called. | Only one "x" appears, with the title "local". |
| loadAnnouncements | adds owner details from the matching org | Only sample data. | `loadAnnouncements('me')` is called. | The sample post gains `orgOwnerId: 'mock-jordan'` and `orgCreatedAt: 7`. |
| loadAnnouncements | still shows shared samples when Firestore fails | The remote lookup fails. | `loadAnnouncements('me')` is called. | Returns only `mock-post`. |
| loadAnnouncements | applies hidden posts and saved edits | Remote posts "a" and "b". "a" is hidden, and "b" is retitled "Edited". | `loadAnnouncements('me')` is called. | Returns `b` and `mock-post`, and "b" has the title "Edited". |
| loadAnnouncementsForOrg | does not call Firestore for a sample org | Local posts "l" (for `mock-org`) and "other" (for a different org). | `loadAnnouncementsForOrg('mock-org', ...)` is called. | Returns `l` and `mock-post` with owner details added. "other" is excluded, and Firestore is not contacted. |
| loadAnnouncementsForOrg | merges local and remote posts for a real org | Remote post "r" (time 100) and local post "l" (time 200). | `loadAnnouncementsForOrg('remote', ...)` is called. | Returns `l` and `r`, and Firestore was asked for org "remote". |
| loadAnnouncementsForOrg | keeps local posts when Firestore fails | The remote lookup fails, and there is a local post "l". | `loadAnnouncementsForOrg('remote', ...)` is called. | Returns `l`. |
| loadAnnouncement | prefers a local post over Firestore | Local post "l". | `loadAnnouncement('l', ...)` is called. | Returns "l", and Firestore is not contacted. |
| loadAnnouncement | finds a shared sample post without calling Firestore | No setup. | `loadAnnouncement('mock-post', ...)` is called. | Returns the sample post, and Firestore is not contacted. |
| loadAnnouncement | falls back to Firestore and applies edits | Remote post "r" with a saved title edit "Edited". | `loadAnnouncement('r', ...)` is called. | The returned title is "Edited". |
| loadAnnouncement | returns null for hidden, missing, or failed lookups | (1) Remote post "r" exists but is hidden. (2) The post is not found. (3) The lookup fails. | `loadAnnouncement` is called in each case. | Returns `null` every time. |

---

## Firestore data services — `src/services/organizations.ts`, `members.ts`, `subscriptions.ts`, `users.ts`, `activity.ts`, `rsvps.ts`

Test file: `src/services/firestore.test.ts`

These services read and write the Firestore database.

**Shared Given:** The Firestore library is faked. Document references are shown as plain paths (for example, `organizations/o/members/u`), so the tests can check which record was used. Firebase counts as "configured" unless a test turns it off.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| organizations | fills in defaults for a sparse document | The database returns an org record "o" with no fields. | `getOrganization('o')` is called. | Returns a complete org with blank text, type "Other", and created time 0. |
| organizations | trims fields and derives the slug on create | The database accepts new records. | `createOrganization` is called with the name `'  Arts & Culture Club '` and the description `' d '`. | The saved record has the name "Arts & Culture Club", the slug `arts-culture-club`, the description "d", and a blank location and link. |
| organizations | filters search results by name or description | Orgs "Garden Club", "Chess" (description mentions "GARDEN"), and "Choir". | `listOrganizations({search: ' garden '})` is called. | Returns orgs `a` and `b`. |
| organizations | only adds a type filter for a specific type | An empty database result. | `listOrganizations` is called with type "All", then with "Campus". | No type filter is added for "All". The filter `type == Campus` is added for "Campus". |
| organizations | rejects without Firebase configured | Firebase is not configured. | `listOrganizations()` is called. | Fails with "Firebase is not configured." |
| members | lets the owner post without a lookup, even offline | Firebase is not configured. The user is the owner. | `canUserPost('o', 'u', 'u')` is called. | Returns true without reading the database. |
| members | checks the member document for everyone else | The member record does not exist. | `canUserPost('o', 'u', 'owner')` is called. | Returns false after reading `organizations/o/members/u`. |
| members | stores a member under their user id | No setup. | `upsertOrgMember` is called for user "u" in org "o". | The record is saved at `organizations/o/members/u`, with id "u". |
| subscriptions | uses one document per user and org | The clock reads 99. | `subscribeToOrg({userId: 'u', orgId: 'o', orgName: 'Org'})` is called. | Saves `subscriptions/u_o` with id `u_o`, the user, the org, the org name, and created time 99. |
| subscriptions | checks the same document | The subscription record exists. | `isSubscribed('u', 'o')` is called. | Returns true after reading `subscriptions/u_o`. |
| users | normalizes the email before searching | A user "u" with the email `sam@x.co`. | `findUserByEmail('  Sam@X.co ')` is called. | Finds user "u". The search uses the lowercased, trimmed `sam@x.co`. |
| users | returns null when no user matches | No users. | `findUserByEmail('none@x.co')` is called. | Returns `null`. |
| users | maps account type "organizer" to "organizer" | A user profile with `accountType: 'organizer'`. | `getUserProfile('u')` is called. | `accountType` is "organizer", and `createdAt` is 5. |
| users | maps account type "both" to "both" | A profile with `accountType: 'both'`. | `getUserProfile('u')` is called. | `accountType` is "both". |
| users | maps account type "admin" to null | A profile with the unknown type `admin`. | `getUserProfile('u')` is called. | `accountType` is `null`. |
| users | maps account type undefined to null | A profile with no account type. | `getUserProfile('u')` is called. | `accountType` is `null`. |
| activity | writes to the target user activity feed | A permission event "e" for user "u". | `recordPermissionEvent` is called. | The event is saved at `users/u/activity/e`. |
| activity | skips sample users entirely | Firebase is not configured, and the event targets a sample user, `mock-priya`. | `recordPermissionEvent` is called. | The database is never contacted, and there is no error. |
| activity | fills in defaults when reading | One stored event with an unknown type `weird` and no other fields. | `listPermissionEvents('u')` is called. | Returns the event with type "allowed", blank org fields, actor name "Someone", target "u", and time 0. |
| rsvps | writes one document per user and announcement | The clock reads 42. | `addRsvp({userId: 'u', userName: 'Una', announcementId: 'a'})` is called. | Saves `rsvps/u_a` with id `u_a`, the user, the name "Una", the announcement, and created time 42. |
| rsvps | cancels by deleting the same document | No setup. | `removeRsvp('u', 'a')` is called. | Deletes `rsvps/u_a`. |
| rsvps | lists RSVPs for an announcement | One RSVP record for announcement "a". | `listRsvps('a')` is called. | Returns 1 RSVP, filtered by `announcementId == a`. |
| rsvps | throws without Firebase | Firebase is not configured. | `listRsvps('a')` is called. | Fails with "Firebase is not configured." |

---

## Announcement service — `src/services/announcements.ts`

Test file: `src/services/announcements.test.ts`

This service reads and writes announcements (posts) in the Firestore database.

**Shared Given:** The Firestore library is faked, and Firebase counts as configured unless a test turns it off. A sample form input has padded text (`'  Title '`, `' Details '`, `' Park '`, `' https://x.co '`), start time 10, no end, a weekly schedule on days 1 and 3, and week 5.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| without Firebase configured | rejects every call | Firebase is not configured. | `getAnnouncement('a')` and `deleteAnnouncement('a')` are called. | Both fail with "Firebase is not configured." |
| reading documents | returns null for a missing document | The record does not exist. | `getAnnouncement('a')` is called. | Returns `null`. |
| reading documents | fills in defaults for a sparse document | The record "a" exists but has no fields. | `getAnnouncement('a')` is called. | Returns a complete announcement with blank text, type "Other", no times, a one-time schedule, no repeat days, no week, and no image. |
| reading documents | keeps weekly fields and coerces numbers | The record holds a weekly schedule, with some numbers stored as text (for example `'1'` and `'100'`). | `getAnnouncement('a')` is called. | The schedule stays weekly, and every value becomes a real number: days `[1, 3]`, week 100, start 200, end 300. |
| reading documents | keeps a real timestamp of zero | The record has `startsAt: 0`. | `getAnnouncement('a')` is called. | `startsAt` is 0, not treated as missing. |
| reading documents | treats an unknown schedule or malformed days as one time | The record has `schedule: 'daily'` and `repeatDays: 'nope'`. | `getAnnouncement('a')` is called. | The schedule is "once" and the repeat days are empty. |
| listing | applies the limit | The database returns posts a, b, and c. | `listRecentAnnouncements(2)` is called. | Returns only `a` and `b`. |
| listing | filters to the requested orgs | Post "a" for org x and post "b" for org y. | `listAnnouncementsForOrgs(['y'])` is called. | Returns only `b`. |
| listing | skips the query with no orgs | No setup. | `listAnnouncementsForOrgs([])` is called. | Returns an empty list without contacting the database. |
| writing | trims text and copies org details on create | The database returns new id "new", the clock reads 1234, and the org is "Org" (Campus). | `createAnnouncement` is called with the padded sample input, the org, and the author "u"/"User". | Returns id "new". The saved record has trimmed text, the org's id, name, and type, the author, created time 1234, the weekly schedule fields, and an empty image. |
| writing | trims text and clears a removed image on update | No setup. | `updateAnnouncement('a', input)` is called with the padded sample input. | The saved update has trimmed text, the schedule fields, and `imageUrl: ''` (the image is cleared). |

---

## Firestore security rules — `firestore.rules`

Test file: `tests/rules/firestore.rules.test.ts`

These tests are not in the unit test count above. They run against the Firestore emulator (which needs Java 21 or later) with `npm run test:rules`, not with `npm test`. CI runs them in the "Firestore rules" job, and a deploy waits for them to pass.

**Shared Given:** Before every test the emulator database is cleared and seeded with the rules turned off: users `owner`, `editor`, and `stranger`, all organizers; org `org1` owned by `owner`; `editor` added to `org1` as a poster; and two posts in `org1`, `ownerPost` by `owner` and `editorPost` by `editor`. `stranger` is signed in but has no link to `org1`. "Signed out" means a request with no signed-in user.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| creating announcements | lets the owner post | Shared seed. | `owner` creates a post in `org1` as its author. | Allowed. |
| creating announcements | lets an added editor post | Shared seed. | `editor` creates a post in `org1` as its author. | Allowed. |
| creating announcements | stops a signed-in user who is not an editor | Shared seed. | `stranger` creates a post in `org1` as its author. | Denied. |
| creating announcements | stops a non-editor posting under the owner’s name | Shared seed. | `stranger` creates a post in `org1` with `owner` as its author. | Denied. |
| creating announcements | stops a signed-out user | Shared seed. | A signed-out user creates a post in `org1`. | Denied. |
| creating announcements | stops an editor whose access was removed | `editor`'s member record is deleted. | `editor` creates a post in `org1`. | Denied. |
| changing announcements | lets the author edit and delete their post | Shared seed. | `editor` changes the title of `editorPost`, then deletes it. | Both allowed. |
| changing announcements | stops a non-editor editing a post | Shared seed. | `stranger` changes the title of `ownerPost`. | Denied. |
| changing announcements | stops a non-editor taking over a post by setting themselves as author | Shared seed. | `stranger` sets `ownerPost`'s author to `stranger`. | Denied. |
| changing announcements | stops a non-editor deleting a post | Shared seed. | `stranger` deletes `ownerPost`. | Denied. |
| changing announcements | stops a signed-out user editing or deleting a post | Shared seed. | A signed-out user changes the title of `ownerPost`, then deletes it. | Both denied. |
| changing org settings | lets the owner change settings | Shared seed. | `owner` renames `org1`. | Allowed. |
| changing org settings | stops a non-editor changing settings | Shared seed. | `stranger` renames `org1`. | Denied. |
| changing org settings | stops a non-editor making themselves owner | Shared seed. | `stranger` sets `org1`'s owner to `stranger`. | Denied. |
| changing org settings | stops a non-editor deleting the org | Shared seed. | `stranger` deletes `org1`. | Denied. |
| changing org settings | stops an added editor changing settings | Shared seed. | `editor` renames `org1`. | Denied. |
| changing org settings | stops a signed-out user changing settings | Shared seed. | A signed-out user renames `org1`. | Denied. |
| granting edit access | lets the owner add an editor | Shared seed. | `owner` adds `stranger` as a member of `org1`. | Allowed. |
| granting edit access | stops a non-editor granting themselves access | Shared seed. | `stranger` adds `stranger` as a member of `org1`. | Denied. |
| granting edit access | stops a non-editor granting someone else access | Shared seed. | `stranger` adds `friend` as a member of `org1`. | Denied. |
| granting edit access | stops a non-editor removing an editor | Shared seed. | `stranger` deletes `editor`'s member record. | Denied. |
| granting edit access | stops an added editor granting access to others | Shared seed. | `editor` adds `stranger` as a member of `org1`. | Denied. |
| granting edit access | stops a signed-out user granting access | Shared seed. | A signed-out user adds `stranger` as a member of `org1`. | Denied. |
