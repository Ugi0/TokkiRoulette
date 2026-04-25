import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        © {year} TokkiCorp Roulette. All rights reserved.
      </p>
      <small className="disclaimer">
        The house always wins. And the house just so happens to be TokkiCorp.
      </small>
    </footer>
  );
}