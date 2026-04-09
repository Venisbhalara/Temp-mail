import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="about-page"
    >
      <div className="container" style={{ maxWidth: 800 }}>
        <header className="about-header">
          <span className="badge">Our Mission</span>
          <h1>About TempMail</h1>
          <p className="subtitle">Protecting your digital identity, one email at a time.</p>
        </header>

        <div className="about-grid">
          <section className="about-section">
            <h2>Who We Are</h2>
            <p>
              TempMail was born out of a simple necessity: the need for privacy in an increasingly 
              connected world. We are a team of privacy advocates and developers who believe that 
              your personal email address shouldn't be the price you pay for accessing digital content.
            </p>
          </section>

          <section className="about-section">
            <h2>Why TempMail?</h2>
            <p>
              Every day, we are asked to provide our email addresses for things like downloading a PDF, 
              joining a forum, or viewing a discounted product. Often, these sites sell your data to 
              advertisers or bombard you with unwanted marketing.
            </p>
            <p>
              <strong>TempMail</strong> solves this by providing you with a secure, instant, and 
              disposable inbox. You get your verification code or content, and then the inbox 
              self-destructs—keeping your primary inbox clean and safe from spam.
            </p>
          </section>

          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Privacy Choice</h3>
              <p>No registration, no personal data, no logs. Ever.</p>
            </div>
            <div className="about-feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Use</h3>
              <p>Generated in milliseconds, ready for your first email.</p>
            </div>
            <div className="about-feature-card">
              <div className="feature-icon">🧹</div>
              <h3>Spam Free</h3>
              <p>Say goodbye to marketing fluff and dangerous phishing.</p>
            </div>
          </div>

          <section className="about-section">
            <h2>Our Commitment</h2>
            <p>
              We are committed to maintaining TempMail as a free, accessible service for everyone. 
              We leverage modern technology, including real-time web sockets and secure backends, 
              to ensure your temporary experience is as smooth as a permanent one.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
