import { Link } from "react-router";
import "./HomePage.css";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__card">
        <h1>Site Under Construction...</h1>
          <p>Feel free to contact at:</p>
          <p> <a className="email" href="mailto:luke@lraykovitz.com">luke@lraykovitz.com</a> </p>
        <Link className="home-page__link" to="/roulette">
          Go to Roulette
        </Link>
      </div>
    </main>
  );
}
