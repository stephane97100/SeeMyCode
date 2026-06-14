# Security Specification & Threat Model (SeeMyCode)

## Data Invariants
1.   **Snippet Integrity**: The snippet owner ID/name are immutable once set.
2.   **Concurrent Lock Safety**: Snippet updates (updating `code`, `language`, etc.) can only be executed if the user either holds the current unexpired `activeEditorUid` lock or if the lock has expired, or if there is no lock.
3.   **Presence Isolation**: Users can only write/update/delete their own presence document under a snippet room path (document ID must match user's actual UID or anonymous guest identifier).
4.   **User Profile Security**: Users can only create or update their own profile document under `users/{userId}` where `{userId}` is equal to `request.auth.uid`. Writing admin privilege flags or modifying other user's records is forbidden.

---

## The "Dirty Dozen" Threat Payloads

### 1. Identity Spoofing (Save snippet under other user Uid)
-   **Payload**: `setDoc(doc(db, "snippets", "snip1"), { code: "...", ownerId: "attacker_uid" })`
-   **Threat**: Attacker creates a snippet posing as a different user.
-   **Verification**: Blocked by checking `request.auth.uid == incoming().ownerId`.

### 2. Lock Overwrite (Attacking typing collaborator)
-   **Payload**: `updateDoc(doc(db, "snippets", "snip1"), { code: "hacked", activeEditorUid: "attacker_uid" })` under active editing lock by 'victim_uid'.
-   **Threat**: Attacker overwrites code when user 'victim_uid' is actively typing and has current lock.
-   **Verification**: Rejecting updates if `existing().activeEditorUid != null && existing().activeEditorUid != request.auth.uid && request.time.toMillis() < existing().activeEditorExpires`.

### 3. Infinite Lock Takeover (Holding lock infinitely)
-   **Payload**: `updateDoc(doc(db, "snippets", "snip1"), { activeEditorExpires: 99999999999999 })`
-   **Threat**: Attacker attempts to hold lock forever by setting an enormous expiry.
-   **Verification**: Blocked by checking `incoming().activeEditorExpires <= request.time.toMillis() + 10000`.

### 4. Code Erasure/Size Poisoning
-   **Payload**: `createDoc(snippets, { code: ("A" * 2 * 1024 * 1024) })` (2MB string)
-   **Threat**: Denial of wallet / storage exhaustion.
-   **Verification**: Enforced `.size() <= 1048576` constraint.

### 5. Profile Takeover (User editing someone else's profiles)
-   **Payload**: `setDoc(doc(db, "users", "victim_uid"), { displayName: "Attacker" })`
-   **Threat**: Attacker writes to victim's profile.
-   **Verification**: Blocked by checking `request.auth.uid == userId`.

### 6. Presence Impersonation
-   **Payload**: `setDoc(doc(db, "snippets/snip1/presence/victim_uid"), { displayName: "Spoofed User" })`
-   **Threat**: Attacker joins as a viewer but claims victim's ID in presence list.
-   **Verification**: Rule enforces `presenceId == request.auth.uid` (or validated unique guest token).

### 7. Ghost Field Injection (Shadow profile update)
-   **Payload**: `updateDoc(doc(db, "users/my_uid"), { isAdmin: true })`
-   **Threat**: Attacker tries to inject structural fields.
-   **Verification**: Strict schema checks and `affectedKeys().hasOnly(['displayName', 'photoURL', 'email'])`.

### 8. Custom Role Hijacking
-   **Payload**: `setDoc(doc(db, "admins", "my_uid"), { isServerAdmin: true })`
-   **Threat**: Creating self-assigned admin permissions.
-   **Verification**: Protected by default-deny catch-all.

### 9. Illegal Expiry Bypass
-   **Payload**: `createDoc(snippets, { expiresAt: "2500-01-01" })`
-   **Threat**: Sniping 30 days limitation rule.
-   **Verification**: Rule restricts expiration boundaries or is managed by server validators.

### 10. Blank Code Creation
-   **Payload**: `createDoc(snippets, { code: "" })`
-   **Threat**: Creating empty snippet records.
-   **Verification**: Require non-empty code strings of reasonable length.

### 11. Fake Parent Insertion
-   **Payload**: `createDoc(snippets, { parentCodeId: "non_existent_id" })`
-   **Threat**: Orphaned relational forks.
-   **Verification**: Prevent invalid IDs.

### 12. List Scraping Attack
-   **Payload**: A querying client executing a broad `getDocs` list query on `snippets`.
-   **Threat**: Scraping all stored snippets to extract proprietary code or leak PII.
-   **Verification**: Strict `allow list: if false;` on snippets or mandatory owner checks.

---

## Test Suite Code Runner (firestore.rules.test.ts)

```ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("SeeMyCode Security Rules", () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "stellar-discovery-zrtgb",
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should fail to create snippet under another user", async () => {
    const context = testEnv.authenticatedContext("attacker_uid");
    const db = context.firestore();
    await assertFails(
      db.collection("snippets").add({
        code: "const a = 1;",
        ownerId: "victim_uid",
        createdAt: new Date().toISOString(),
      })
    );
  });

  it("should block update of snippet code if other collaborator holds lock", async () => {
    // Setup snippet with a lock owned by victim
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("snippets").doc("test_snip").set({
        code: "original code",
        language: "javascript",
        createdAt: "2026-06-09T00:00:00Z",
        expiresAt: "2026-07-09T00:00:00Z",
        activeEditorUid: "victim_uid",
        activeEditorExpires: Date.now() + 60000, // Lock unexpired
      });
    });

    // Attacker tries to write code
    const attackerContext = testEnv.authenticatedContext("attacker_uid");
    const db = attackerContext.firestore();
    await assertFails(
      db.collection("snippets").doc("test_snip").update({
        code: "attacker injection",
      })
    );
  });
});
```
