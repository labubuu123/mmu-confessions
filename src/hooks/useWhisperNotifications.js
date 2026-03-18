import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function useWhisperNotifications(currentIdentity) {
  const [unreadWhispers, setUnreadWhispers] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('global-whisper-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whisper_messages',
        },
        (payload) => {
          const newMsg = payload.new;

          if (
            currentIdentity &&
            newMsg.author_name === currentIdentity.name &&
            newMsg.author_color === currentIdentity.color
          ) {
            return;
          }

          setUnreadWhispers((prev) => [newMsg, ...prev]);

          try {
            const audio = new Audio('/pop.mp3');
            audio.play().catch((e) => console.log('Audio blocked by browser auto-play policy', e));
          } catch (err) {
            console.error('Failed to play sound', err);
          }

          if (notificationsEnabled && document.hidden) {
            new Notification(`New Whisper in ${newMsg.room_tag}`, {
              body: `${newMsg.author_name}: ${newMsg.content}`,
              icon: '/favicon.svg',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentIdentity, notificationsEnabled]);

  const clearUnreadWhispers = () => {
    setUnreadWhispers([]);
  };

  return { unreadWhispers, clearUnreadWhispers };
}