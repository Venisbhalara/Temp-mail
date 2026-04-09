import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="legal-page"
    >
      <div className="container" style={{ maxWidth: 800 }}>
        <header className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: April 9, 2026</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              At TempMail, we prioritize your privacy. We do not require registration or personal information 
              to use our temporary email services. However, we may collect certain non-personal information:
            </p>
            <ul>
              <li><strong>Log Data:</strong> As with most websites, we collect information that your browser sends whenever you visit our service ("Log Data"). This may include your IP address, browser type, and pages visited.</li>
              <li><strong>Cookies:</strong> We use cookies to store your preferences and session information to provide a consistent experience.</li>
            </ul>
          </section>

          <section>
            <h2>2. Advertising & Third-Party Services</h2>
            <p>
              We use third-party advertising companies to serve ads when you visit our website. 
              These companies may use information about your visits to this and other websites in order 
              to provide advertisements about goods and services of interest to you.
            </p>
            <p>
              <strong>Google AdSense:</strong> Google, as a third-party vendor, uses cookies to serve ads on our site. 
              Google's use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. 
              Users may opt out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy.
            </p>
          </section>

          <section>
            <h2>3. Use of Your Information</h2>
            <p>
              The email addresses generated are temporary. All emails and associated data are automatically 
              deleted after a set period. We do not monitor the content of the emails received through our service, 
              except for automated security filtering and spam prevention.
            </p>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission 
              over the Internet or method of electronic storage is 100% secure. While we strive to use 
              commercially acceptable means to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2>5. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically 
              for any changes.
            </p>
          </section>

          <section>
            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us via our Contact Page.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
