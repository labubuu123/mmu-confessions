import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../components/NotificationSystem";

export const useRealtimeNotifications = () => {
  const navigate = useNavigate();
  const { info, success } = useNotifications();

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleNotification = (title, body, url, tag) => {
      if (document.visibilityState === "visible") {
        info(`${title} - ${body}`, 5000);
        return;
      }

      const lastNotifTag = localStorage.getItem("last_notif_tag");
      const lastNotifTime = parseInt(
        localStorage.getItem("last_notif_time") || "0",
      );
      const now = Date.now();

      if (lastNotifTag === tag && now - lastNotifTime < 3000) {
        return;
      }

      localStorage.setItem("last_notif_tag", tag);
      localStorage.setItem("last_notif_time", now.toString());

      if (Notification.permission === "granted") {
        const n = new Notification(title, {
          body: body,
          icon: "/favicon.svg",
          tag: tag,
          silent: false,
        });
        n.onclick = () => {
          window.focus();
          navigate(url);
          n.close();
        };
      }
    };

    const channel = supabase
      .channel("global-app-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confessions" },
        (payload) => {
          if (payload.new && payload.new.approved === true) {
            const isNewlyVisible =
              payload.eventType === "INSERT" ||
              (payload.eventType === "UPDATE" &&
                payload.old &&
                payload.old.approved === false);
            if (isNewlyVisible) {
              handleNotification(
                "New Confession! 📢",
                payload.new.text
                  ? `${payload.new.text.substring(0, 60)}...`
                  : "Check out the latest confession!",
                `/post/${payload.new.id}`,
                `confession-${payload.new.id}`,
              );
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const newComment = payload.new;
          const myPostsRaw = localStorage.getItem("my_posts");
          const myAnonId = localStorage.getItem("anonId");

          if (!myPostsRaw || !myAnonId) return;

          const myPosts = JSON.parse(myPostsRaw);
          const isMyPost = myPosts.some(
            (id) => String(id) === String(newComment.post_id),
          );
          const isNotMe = String(newComment.author_id) !== String(myAnonId);

          if (isMyPost && isNotMe) {
            handleNotification(
              "New Reply! 💬",
              newComment.text
                ? `Someone replied: "${newComment.text.substring(0, 50)}..."`
                : "New comment on your confession.",
              `/post/${newComment.post_id}`,
              `reply-${newComment.post_id}`,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adult_confessions" },
        (payload) => {
          if (payload.new && payload.new.is_approved === true) {
            const isNewlyVisible =
              payload.eventType === "INSERT" ||
              (payload.eventType === "UPDATE" &&
                payload.old &&
                payload.old.is_approved === false);
            if (isNewlyVisible) {
              handleNotification(
                "New 18+ Confession! 🌶️",
                payload.new.content
                  ? `${payload.new.content.substring(0, 50)}...`
                  : "Spicy new content added!",
                `/adult/${payload.new.id}`,
                `adult-confession-${payload.new.id}`,
              );
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "adult_comments" },
        (payload) => {
          const newComment = payload.new;
          const myPostsRaw = localStorage.getItem("my_posts");
          const myAnonId = localStorage.getItem("anonId");

          if (!myPostsRaw || !myAnonId) return;

          const myPosts = JSON.parse(myPostsRaw);
          const isMyPost = myPosts.some(
            (id) => String(id) === String(newComment.post_id),
          );
          const isNotMe = String(newComment.author_id) !== String(myAnonId);

          if (isMyPost && isNotMe) {
            handleNotification(
              "New Whisper! 🤫",
              newComment.text
                ? `Someone whispered: "${newComment.text.substring(0, 40)}..."`
                : "New whisper on your post.",
              `/adult/${newComment.post_id}`,
              `adult-reply-${newComment.post_id}`,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "polls" },
        (payload) => {
          handleNotification(
            "New Poll! 📊",
            payload.new.question || "A new poll has started!",
            `/post/${payload.new.confession_id}`,
            `poll-${payload.new.id}`,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          handleNotification(
            "New Event! 📅",
            `${payload.new.event_name} - ${payload.new.description ? payload.new.description.substring(0, 40) : "Check it out!"}`,
            `/post/${payload.new.confession_id}`,
            `event-${payload.new.id}`,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matchmaker_loves" },
        (payload) => {
          const myAnonId = localStorage.getItem("anonId");
          if (myAnonId && payload.new.to_user_id === myAnonId) {
            handleNotification(
              "Matchmaker Update 💘",
              "Someone sent you a Love request! Click to see who.",
              "/matchmaker",
              `love-req-${payload.new.id}`,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matchmaker_loves" },
        (payload) => {
          const myAnonId = localStorage.getItem("anonId");
          if (myAnonId && payload.new.status === "accepted") {
            if (
              payload.new.from_user_id === myAnonId ||
              payload.new.to_user_id === myAnonId
            ) {
              handleNotification(
                "It's a Match! 💑",
                "You have a new connection in Matchmaker!",
                "/matchmaker",
                `match-love-${payload.new.id}`,
              );
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matchmaker_matches" },
        (payload) => {
          const myAnonId = localStorage.getItem("anonId");
          if (
            myAnonId &&
            (payload.new.user1_id === myAnonId ||
              payload.new.user2_id === myAnonId)
          ) {
            handleNotification(
              "New Match! ✨",
              "You have been matched!",
              "/matchmaker",
              `match-rec-${payload.new.id}`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, info, success]);
};
