package com.salbeau.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import java.util.concurrent.atomic.AtomicInteger

class SalbeauFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SalbeauFCMService"
        const val CHANNEL_ID = "salbeau_notifications"
        const val CHANNEL_NAME = "Salbeau Orders & Alerts"
        const val PREFS_NAME = "salbeau_fcm_prefs"
        const val KEY_FCM_TOKEN = "fcm_token"
        private val notificationIdCounter = AtomicInteger(1001)

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Order fulfillment, B2B verification, and exclusive store alerts"
                    enableLights(true)
                    enableVibration(true)
                    setShowBadge(true)
                }
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Token received: ${token.take(15)}...")

        // Save token to SharedPreferences
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply()

        // Forward to React Native module
        SalbeauFCMModule.sendTokenRefresh(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM Message received from: ${remoteMessage.from}")

        // 1. Extract notification payload
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Salbeau Beauty Store"

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: remoteMessage.data["message"]
            ?: "You have a new update from Salbeau."

        val dataMap = remoteMessage.data

        // 2. Notify React Native if app is active
        SalbeauFCMModule.sendPushReceived(title, body, dataMap)

        // 3. Post system tray / lock screen notification
        showSystemNotification(title, body, dataMap)
    }

    private fun showSystemNotification(title: String, body: String, data: Map<String, String>) {
        createNotificationChannel(this)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            for ((k, v) in data) {
                putExtra(k, v)
            }
        }

        val pendingIntentFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationIdCounter.getAndIncrement(),
            intent,
            pendingIntentFlag
        )

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        try {
            val notificationManager = NotificationManagerCompat.from(this)
            notificationManager.notify(notificationIdCounter.getAndIncrement(), notificationBuilder.build())
        } catch (e: SecurityException) {
            Log.w(TAG, "Notification permission missing or denied: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to display system notification: ${e.message}", e)
        }
    }
}

