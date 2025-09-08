import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getAuth } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../firebase';

// Configure notification handler globally (show alert in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushAndSaveToken() {
  if (!Device.isDevice) {
    console.log('Not a physical device - push notifications won\'t work');
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '65117c14-8d88-4cc1-8399-8c03fd2e9376', 
    });
    const token = tokenData.data;
    console.log('Expo push token:', token);

    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      console.log('No authenticated user');
      return token;
    }

    // Save token to Firestore
    await setDoc(
      doc(db, `users/${uid}/pushTokens`, token),
      { 
        token, 
        platform: Platform.OS, 
        updatedAt: serverTimestamp(),
        deviceId: Device.osName + '-' + Device.modelName
      },
      { merge: true }
    );

    console.log('Push token saved to Firestore');
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Add notification listeners
export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notification tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    const { type, postId, commentId } = response.notification.request.content.data as any;
    
    // Handle navigation based on notification type
    // You'll need to implement navigation logic here
    if (type === 'upvote' || type === 'comment') {
      // Navigate to the specific post
      console.log(`Navigate to post: ${postId}`);
    }
  });

  return {
    remove: () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    }
  };
}