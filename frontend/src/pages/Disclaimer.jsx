import React from 'react';
import { motion } from 'framer-motion';

export default function Disclaimer() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="legal-page"
    >
      <div className="container" style={{ maxWidth: 800 }}>
        <header className="legal-header">
          <h1>Disclaimer</h1>
          <p className="last-updated">Last Updated: April 9, 2026</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. General Information</h2>
            <p>
              The information provided by TempMail ("we", "us", or "our") on TempMail.com is for general 
              informational purposes only. All information on the site is provided in good faith, however we 
              make no representation or warranty of any kind, express or implied, regarding the accuracy, 
              adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>
          </section>

          <section>
            <h2>2. External Links Disclaimer</h2>
            <p>
              The site may contain (or you may be sent through the site) links to other websites or content 
              belonging to or originating from third parties. Such external links are not investigated, monitored, 
              or checked for accuracy, adequacy, validity, reliability, availability or completeness by us.
            </p>
          </section>

          <section>
            <h2>3. Professional Disclaimer</h2>
            <p>
              The site cannot and does not contain professional advice. The information is provided 
              for general informational and educational purposes only and is not a substitute for professional 
              advice. Accordingly, before taking any actions based upon such information, we encourage you 
              to consult with the appropriate professionals.
            </p>
          </section>

          <section>
            <h2>4. Use at Your Own Risk</h2>
            <p>
              Under no circumstance shall we have any liability to you for any loss or damage of any kind 
              incurred as a result of the use of the site or reliance on any information provided on the site. 
              Your use of the site and your reliance on any information on the site is solely at your own risk.
            </p>
          </section>

          <section>
            <h2>5. Service Reliability</h2>
            <p>
              While we aim to keep the service operational, we do not guarantee uptime or availability. 
              The temporary nature of the email addresses means that data is not persistent. 
              You should not use our service for any mission-critical communication.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
