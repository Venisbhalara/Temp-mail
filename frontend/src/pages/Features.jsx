import React from "react";
import { motion } from "framer-motion";
import FAQ from "../components/FAQ";

export default function Features() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="features-page"
    >
      <div className="container" style={{ maxWidth: 900 }}>
        <header
          className="legal-header"
          style={{ textAlign: "center", marginBottom: "var(--sp-12)" }}
        >
          {/* <span className="badge">Service Details</span> */}
          <h1>Features & How It Works</h1>
          <p className="subtitle">
            Everything you need to know about using TempMail.
          </p>
        </header>

        <div className="home-content" style={{ marginTop: 0 }}>
          {/* Features Grid */}
          <section className="features-grid">
            <div className="feature-item">
              <div className="feature-item__icon">🛡️</div>
              <h3>Protect Your Privacy</h3>
              <p>
                Keep your primary inbox clean and safe from tracking, marketing,
                and potential phishing attacks.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-item__icon">⚡</div>
              <h3>Instant & Automatic</h3>
              <p>
                No registration required. Get your anonymous email address the
                second you land on the page.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-item__icon">🛑</div>
              <h3>Stop Spam</h3>
              <p>
                Stop websites from cluttering your inbox with unwanted
                newsletters and promotional emails.
              </p>
            </div>
          </section>

          {/* How it Works Section */}
          <section
            className="how-it-works"
            style={{ marginTop: "var(--sp-12)" }}
          >
            <h2 className="section-title">How It Works</h2>
            <div className="steps-container">
              <div className="step-card">
                <span className="step-num">01</span>
                <h3>Get Your Email</h3>
                <p>
                  Copy the automatically generated temporary address from the
                  top bar.
                </p>
              </div>
              <div className="step-card">
                <span className="step-num">02</span>
                <h3>Use It Anywhere</h3>
                <p>
                  Paste it on any website, forum, or service that requires an
                  email verification.
                </p>
              </div>
              <div className="step-card">
                <span className="step-num">03</span>
                <h3>Read Instantly</h3>
                <p>
                  Incoming emails appear in real-time in your inbox below. No
                  refresh needed.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <div style={{ marginTop: "var(--sp-12)" }}>
            <FAQ />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
