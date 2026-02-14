const {setGlobalOptions} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

const app = initializeApp();
const db = getFirestore(app);

setGlobalOptions({maxInstances: 10});

/**
 * Send a push notification when Eden sends a new message.
 * Triggers on any new message doc where sender == "eden".
 */
exports.onNewEdenMessage = onDocumentCreated(
    "conversations/{conversationId}/messages/{messageId}",
    async (event) => {
      const snap = event.data;
      if (!snap) return;

      const message = snap.data();
      if (message.sender !== "eden") return;

      const conversationId = event.params.conversationId;

      // Look up the conversation to find the device
      const convDoc = await db
          .doc(`conversations/${conversationId}`)
          .get();

      if (!convDoc.exists) {
        logger.warn("Conversation not found:", conversationId);
        return;
      }

      const {deviceId} = convDoc.data();
      if (!deviceId) {
        logger.warn("No deviceId on conversation:", conversationId);
        return;
      }

      // Look up the device's FCM token
      const deviceDoc = await db.doc(`devices/${deviceId}`).get();
      if (!deviceDoc.exists) {
        logger.warn("Device not found:", deviceId);
        return;
      }

      const {fcmToken} = deviceDoc.data();
      if (!fcmToken) {
        logger.warn("No FCM token for device:", deviceId);
        return;
      }

      // Build notification
      const preview = (message.text || "").substring(0, 100);
      const notification = {
        token: fcmToken,
        notification: {
          title: "Eden",
          body: preview || "New message",
        },
        data: {
          conversationId,
          messageId: event.params.messageId,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      try {
        await getMessaging().send(notification);
        logger.info("Push sent to device:", deviceId);
      } catch (err) {
        if (err.code === "messaging/registration-token-not-registered") {
          logger.warn("Stale FCM token, removing:", deviceId);
          await db.doc(`devices/${deviceId}`).update({fcmToken: null});
        } else {
          logger.error("FCM send error:", err);
        }
      }
    },
);
