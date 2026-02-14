const { FieldValue } = require("firebase-admin/firestore");
const config = require("./config");

class FirestoreWatcher {
  constructor(db, openclawClient) {
    this.db = db;
    this.client = openclawClient;
    this.unsubscribes = [];
    this.heartbeatTimer = null;
    this.activeConversations = new Set();
  }

  /**
   * Start watching all conversations for pending messages.
   */
  start() {
    this._watchPendingMessages();
    this._startHeartbeat();
    this._setupClientListeners();
    console.log("[watcher] Firestore watcher started");
  }

  stop() {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    clearInterval(this.heartbeatTimer);
    console.log("[watcher] Firestore watcher stopped");
  }

  /**
   * Watch for messages with bridgeStatus == "pending" across all conversations.
   */
  _watchPendingMessages() {
    const query = this.db
      .collectionGroup("messages")
      .where("bridgeStatus", "==", "pending")
      .where("sender", "==", "user");

    const unsub = query.onSnapshot(
      (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            this._handlePendingMessage(change.doc);
          }
        }
      },
      (err) => {
        console.error("[watcher] Snapshot error:", err.message);
      },
    );

    this.unsubscribes.push(unsub);
  }

  /**
   * Relay a pending message to OpenClaw and write the response back.
   */
  async _handlePendingMessage(doc) {
    const data = doc.data();
    const msgRef = doc.ref;
    const conversationId = msgRef.parent.parent.id;

    console.log(`[watcher] Relaying message ${doc.id} from conversation ${conversationId}`);

    // Mark as relayed
    await msgRef.update({ bridgeStatus: "relayed" });

    // Set typing indicator
    await this._setTyping(conversationId, true);

    try {
      // Send to OpenClaw — streaming deltas are handled by the client
      const responseText = await this.client.sendMessage(data.text, conversationId);

      // Clear typing indicator
      await this._setTyping(conversationId, false);

      // Write Eden's response as a new message
      const edenMsgRef = msgRef.parent.doc();
      await edenMsgRef.set({
        sender: "eden",
        type: "text",
        text: responseText,
        status: "delivered",
        bridgeStatus: "responded",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Mark original as responded
      await msgRef.update({ bridgeStatus: "responded" });

      // Update conversation denormalized fields
      await this.db.doc(`conversations/${conversationId}`).update({
        lastMessage: {
          text: responseText.substring(0, 200),
          sender: "eden",
          createdAt: FieldValue.serverTimestamp(),
        },
        unreadCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`[watcher] Eden responded to ${doc.id}`);
    } catch (err) {
      console.error(`[watcher] Error relaying message ${doc.id}:`, err.message);
      await this._setTyping(conversationId, false);
      await msgRef.update({ bridgeStatus: "error", bridgeError: err.message });
    }
  }

  /**
   * Listen for streaming deltas to update typing/partial response.
   */
  _setupClientListeners() {
    this.client.on("delta", async ({ conversationId, delta, accumulated }) => {
      // Update presence with partial text for real-time display
      try {
        await this.db.doc(`presence/${conversationId}`).set(
          {
            edenTyping: true,
            partialResponse: accumulated.substring(0, 500),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        // Non-critical, don't fail the relay
      }
    });
  }

  async _setTyping(conversationId, isTyping) {
    try {
      await this.db.doc(`presence/${conversationId}`).set(
        {
          edenTyping: isTyping,
          partialResponse: isTyping ? "" : FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error("[watcher] Failed to set typing:", err.message);
    }
  }

  /**
   * Periodically update bridge heartbeat so the iOS app knows the bridge is alive.
   */
  _startHeartbeat() {
    const update = async () => {
      try {
        await this.db.doc("presence/_bridge").set(
          {
            bridgeOnline: true,
            bridgeLastSeen: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (err) {
        console.error("[watcher] Heartbeat error:", err.message);
      }
    };

    update(); // Immediately
    this.heartbeatTimer = setInterval(update, config.heartbeatIntervalMs);
  }
}

module.exports = FirestoreWatcher;
