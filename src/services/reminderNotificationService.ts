import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export class ReminderNotificationService {
  /**
   * Request notification permissions.
   */
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  /**
   * Schedule a local notification for a note reminder.
   */
  static async scheduleNoteReminder(
    noteId: string,
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<string | null> {
    try {
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
      console.error('Failed to schedule reminder notification:', e);
      return null;
    }
  }

  /**
   * Cancel scheduled reminder for a note.
   */
  static async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`note_reminder_${noteId}`);
    } catch (e) {
      // Ignore if doesn't exist
    }
  }
}
