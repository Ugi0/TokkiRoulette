import { createContext, useContext, useState } from "react";

type OverlayContextType = {
  message: string | null;
  showOverlay: (msg: string) => void;
  hideOverlay: () => void;
};

const OverlayContext = createContext<OverlayContextType | null>(null);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showOverlay = (msg: string) => setMessage(msg);
  const hideOverlay = () => setMessage(null);

  return (
    <OverlayContext.Provider
      value={{ message, showOverlay, hideOverlay }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used inside OverlayProvider");
  }
  return ctx;
}