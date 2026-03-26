import { useEffect, useRef, useCallback } from 'react';

const NOTIFICATION_SOUND_URL = '/sounds/notification.wav';
const ORIGINAL_TITLE = 'Instituto Integra';

export function useWhatsAppNotifications() {
  const audioRef = useRef<HTMLAudio element | null>(null);
  const unreadCountRef = useRef(0);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPageVisibleRef = useRef(!document.hidden);

  // Initialize audio on first user interaction
  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.6;
    audioRef.current = audio;

    const handleVisibility = () => {
      isPageVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Reset when user returns to the tab
        unreadCountRef.current = 0;
        document.title = ORIGINAL_TITLE;
        if (blinkIntervalRef.current) {
          clearInterval(blinkIntervalRef.current);
          blinkIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
      document.title = ORIGINAL_TITLE;
    };
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — user hasn't interacted yet
      });
    }
  }, []);

  const updateTabTitle = useCallback(() => {
    unreadCountRef.current += 1;
    const count = unreadCountRef.current;
    document.title = `(${count}) 💬 ${ORIGINAL_TITLE}`;

    // Start blinking if not already
    if (!blinkIntervalRef.current) {
      let visible = true;
      blinkIntervalRef.current = setInterval(() => {
        document.title = visible
          ? `(${unreadCountRef.current}) 💬 Nova mensagem!`
          : `(${unreadCountRef.current}) ${ORIGINAL_TITLE}`;
        visible = !visible;
      }, 1500);
    }
  }, []);

  const showDesktopNotification = useCallback((senderName: string, text: string) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    new Notification(`💬 ${senderName}`, {
      body: text || 'Nova mensagem',
      icon: '/pwa-192x192.png',
      tag: 'whatsapp-notification', // collapses multiple
    });
  }, []);

  const requestPermission = useCallback(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /**
   * Call this when a new received message arrives via realtime.
   * Only triggers notifications if the tab is not focused.
   */
  const notifyNewMessage = useCallback((senderName: string, text: string) => {
    // Only notify when page is hidden/blurred
    if (!isPageVisibleRef.current) {
      playSound();
      updateTabTitle();
      showDesktopNotification(senderName, text);
    } else {
      // Even when visible, play a subtle sound
      playSound();
    }
  }, [playSound, updateTabTitle, showDesktopNotification]);

  return { notifyNewMessage, requestPermission };
}
