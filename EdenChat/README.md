# EdenChat

Firebase-backed direct iPhone chat app for Eden.

## Initialized

- Firebase project: `edenchat-jo`
- Firestore config: `firestore.rules`, `firestore.indexes.json`
- Cloud Functions scaffold: `functions/`
- Hosting scaffold: `hosting/`

## Next steps

1. Create iOS app in Xcode (SwiftUI)
   - App name: `EdenChat`
   - Bundle ID: `ai.jo.eden`
2. In Firebase Console, add an iOS app for bundle `ai.jo.eden`
3. Download `GoogleService-Info.plist` and add it to the Xcode project
4. Add Firebase iOS SDK packages:
   - FirebaseAuth
   - FirebaseFirestore
   - FirebaseMessaging (optional)
5. Implement Cloud Function bridge in `functions/index.js` for OpenClaw relay
6. Deploy backend:
   - `firebase deploy --only functions,firestore,hosting`

## Local commands

```bash
cd EdenChat
firebase emulators:start
firebase deploy --only firestore
firebase deploy --only functions
firebase deploy --only hosting
```
