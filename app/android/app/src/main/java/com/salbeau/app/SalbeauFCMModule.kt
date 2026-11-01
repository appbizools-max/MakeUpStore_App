package com.salbeau.app

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessaging

class SalbeauFCMModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "SalbeauFCM"
        private const val TAG = "SalbeauFCMModule"
        var activeReactContext: ReactApplicationContext? = null

        fun sendTokenRefresh(token: String) {
            try {
                activeReactContext?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        val params = Arguments.createMap().apply {
                            putString("token", token)
                        }
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit("onFCMTokenRefresh", params)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to emit onFCMTokenRefresh: ${e.message}")
            }
        }

        fun sendPushReceived(title: String, body: String, data: Map<String, String>) {
            try {
                activeReactContext?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        val dataMap = Arguments.createMap()
                        for ((k, v) in data) {
                            dataMap.putString(k, v)
                        }
                        val params = Arguments.createMap().apply {
                            putString("title", title)
                            putString("body", body)
                            putMap("data", dataMap)
                            putDouble("timestamp", System.currentTimeMillis().toDouble())
                        }
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit("onFCMPushReceived", params)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to emit onFCMPushReceived: ${e.message}")
            }
        }
    }

    init {
        activeReactContext = reactContext
        SalbeauFirebaseMessagingService.createNotificationChannel(reactContext)
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun getFCMToken(promise: Promise) {
        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result
                    Log.d(TAG, "FCM token retrieved: ${token?.take(15)}...")

                    // Save locally in prefs
                    val prefs = reactContext.getSharedPreferences(
                        SalbeauFirebaseMessagingService.PREFS_NAME,
                        Context.MODE_PRIVATE
                    )
                    prefs.edit().putString(SalbeauFirebaseMessagingService.KEY_FCM_TOKEN, token).apply()

                    promise.resolve(token)
                } else {
                    Log.w(TAG, "FCM token fetch failed: ${task.exception?.message}")
                    // Fallback to cached token
                    val prefs = reactContext.getSharedPreferences(
                        SalbeauFirebaseMessagingService.PREFS_NAME,
                        Context.MODE_PRIVATE
                    )
                    val cachedToken = prefs.getString(SalbeauFirebaseMessagingService.KEY_FCM_TOKEN, null)
                    if (cachedToken != null) {
                        promise.resolve(cachedToken)
                    } else {
                        promise.reject("FCM_FETCH_FAILED", task.exception?.message ?: "Unknown error")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in getFCMToken: ${e.message}", e)
            promise.reject("FCM_EXCEPTION", e.message)
        }
    }

    @ReactMethod
    fun displayNotification(title: String, body: String, data: ReadableMap?, promise: Promise) {
        try {
            SalbeauFirebaseMessagingService.createNotificationChannel(reactContext)

            val intent = Intent(reactContext, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                data?.let { readableMap ->
                    val iterator = readableMap.keySetIterator()
                    while (iterator.hasNextKey()) {
                        val key = iterator.nextKey()
                        try {
                            readableMap.getString(key)?.let { putExtra(key, it) }
                        } catch (_: Exception) {}
                    }
                }
            }

            val pendingIntentFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val notifId = (System.currentTimeMillis() % 100000).toInt()
            val pendingIntent = PendingIntent.getActivity(
                reactContext,
                notifId,
                intent,
                pendingIntentFlag
            )

            val builder = NotificationCompat.Builder(reactContext, SalbeauFirebaseMessagingService.CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            val manager = NotificationManagerCompat.from(reactContext)
            manager.notify(notifId, builder.build())
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "displayNotification error: ${e.message}", e)
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun subscribeToTopic(topic: String, promise: Promise) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(topic)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        promise.resolve(true)
                    } else {
                        promise.reject("SUBSCRIBE_FAILED", task.exception?.message)
                    }
                }
        } catch (e: Exception) {
            promise.reject("SUBSCRIBE_EXCEPTION", e.message)
        }
    }

    @ReactMethod
    fun unsubscribeFromTopic(topic: String, promise: Promise) {
        try {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        promise.resolve(true)
                    } else {
                        promise.reject("UNSUBSCRIBE_FAILED", task.exception?.message)
                    }
                }
        } catch (e: Exception) {
            promise.reject("UNSUBSCRIBE_EXCEPTION", e.message)
        }
    }

    @ReactMethod
    fun hasNotificationPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val granted = ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                promise.resolve(granted)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native event emitter subscription
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native event emitter unsubscription
    }
}
