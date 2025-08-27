// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

// Show message notification
export const showMessageNotification = (senderName: string, message: string) => {
  showNotification(`New message from ${senderName}`, {
    body: message,
    tag: 'message'
  });
};

// Show general notification
export const showGeneralNotification = (title: string, body: string) => {
  showNotification(title, {
    body,
    tag: 'notification'
  });
};