"use client";

import "./Footer.css";
import { useEffect, useState } from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  const [text, setText] = useState<string>("");

  useEffect(() => {
    async function loadFooterText() {
      try {
        const res = await fetch("/api/quote");

        setText(await res.text());
      } catch (err) {
        console.error("Failed to fetch footer text", err);
      }
    }

    loadFooterText();
  }, []);

  return (
    <footer className="footer">
      <p>© {year} TokkiCorp Roulette. All rights reserved.</p>
      <small className="disclaimer">
        {text || "Loading wisdom from TokkiCorp..."}
      </small>
    </footer>
  );
}
