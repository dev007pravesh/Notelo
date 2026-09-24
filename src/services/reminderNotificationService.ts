import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Detect if running in Expo Go (notifications are not supported there since SDK 53)
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * expo-notifications is unavailable in Expo Go on Android (SDK 53+).
 * This service uses require() wrapped in try-catch to lazily load it
 * and gracefully degrade when not available.
 */

let _Notifications: any = null;
let _loadAttempted = false;

function loadNotificationsModule(): any {
  if (_loadAttempted) return _Notifications;
  _loadAttempted = true;

  // Don't even attempt to load in Expo Go — it will throw internal errors
  if (isExpoGo) return null;

  try {
    // Use require() inside try-catch — if the native module is missing,
    // this will throw and we'll silently skip
    _Notifications = require('expo-notifications');

    _Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: _Notifications.AndroidNotificationPriority?.HIGH,
      }),
    });
  } catch (e) {
    console.log('expo-notifications not available — running in Expo Go mode');
    _Notifications = null;
  }

  return _Notifications;
}

export class ReminderNotificationService {
  /**
   * Request notification permissions.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const Notifications = loadNotificationsModule();
      if (!Notifications) return false;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.log('Notification permissions unavailable:', e);
      return false;
    }
  }

  /**
   * Schedule a local notification for a note reminder.
   * Silently returns null if notifications are not available (Expo Go).
   */
  static async scheduleNoteReminder(
    noteId: string,
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<string | null> {
    try {
      const Notifications = loadNotificationsModule();
      if (!Notifications) {
        console.log('Notifications not available — skipping reminder');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Cancel any existing reminder for this note first
      await this.cancelNoteReminder(noteId);

      const triggerSeconds = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: `note_reminder_${noteId}`,
        content: {
          title: title.trim() || 'Reminder',
          body: body.trim() || 'You have a note reminder in Notelo',
          data: { noteId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        },
      });

      return notificationId;
    } catch (e) {
      console.log('Failed to schedule reminder:', e);
      return null;
    }
  }

  /**
   * Cancel scheduled reminder for a note.
   */
  static async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      const Notifications = loadNotificationsModule();
      if (!Notifications) return;
      await Notifications.cancelScheduledNotificationAsync(`note_reminder_${noteId}`);
    } catch (e) {
      // Ignore if doesn't exist or not available
    }
  }
}
