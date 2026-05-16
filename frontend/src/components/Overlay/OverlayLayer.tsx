import Notification from "../Notification";
import { useOverlay } from "./OverlayContext";

export function OverlayLayer() {
  const { message, hideOverlay } = useOverlay();

  return (
    <Notification
      notification={message}
      onDismiss={hideOverlay}
    />
  );
}
