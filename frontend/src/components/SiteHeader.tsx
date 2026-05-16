import { NavLink } from "react-router";
import "./SiteHeader.css";

export default function SiteHeader() {
    return (
        <header className="site-header">
            <nav className="site-header__nav" aria-label="Primary navigation">
                <NavLink className="site-header__brand" to="/">
                    Tokki Roulette
                </NavLink>
                <div className="site-header__links">
                    <NavLink
                        className={({ isActive }) =>
                            `site-header__link${isActive ? " site-header__link--active" : ""}`
                        }
                        to="/"
                        end
                    >
                        Home
                    </NavLink>
                    <NavLink
                        className={({ isActive }) =>
                            `site-header__link${isActive ? " site-header__link--active" : ""}`
                        }
                        to="/analytics"
                    >
                        Analytics
                    </NavLink>
                </div>
            </nav>
        </header>
    );
}
