import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-name">TempMail</span>
            </div>
            <p className="footer__tagline">
              Providing secure, disposable email addresses to keep your inbox
              clean and your identity safe.
            </p>
          </div>

          <div className="footer__links-group">
            <h3 className="footer__title">Product</h3>
            <ul className="footer__links">
              <li>
                <Link to="/">Temporary Email</Link>
              </li>
              {/* <li><Link to="/">Temporary SMS</Link></li> */}
              <li>
                <Link to="/contact">Support</Link>
              </li>
            </ul>
          </div>

          <div className="footer__links-group">
            <h3 className="footer__title">Legal</h3>
            <ul className="footer__links">
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/disclaimer">Disclaimer</Link>
              </li>
            </ul>
          </div>

          <div className="footer__links-group">
            <h3 className="footer__title">Connect</h3>
            <ul className="footer__links">
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              {/* <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} TempMail. All rights reserved. Made with ❤️ for
            privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}
