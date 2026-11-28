import { useEffect, useRef } from "react";
import "./Notification.css";

export default function Notification({
  notification,
  duration = 3000,
  onDismiss,
}: {
  notification: string | null;
  duration?: number;
  onDismiss: () => void;
}) {
  // Parents pass a new onDismiss on every render; keep it in a ref so re-renders
  // (e.g. hovering the page title) don't restart the auto-dismiss timer.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, duration]);

  if (!notification) return null;

return (
  <div className="notification">
    <p className="notification-text">
      {notification}
      <img
        src="/cheer.gif"
        alt=""
        className="notification-emote"
      />
    </p>
  </div>
);

}