import { useEffect } from "react";
import "./Notification.css";

export default function Notification({
  notification,
  duration = 2000,
  onDismiss,
}: {
  notification: string | null;
  duration?: number;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, duration, onDismiss]);

  if (!notification) return null;

  return (
    <div className="notification">
      <p>{notification}</p>
    </div>
  );
}