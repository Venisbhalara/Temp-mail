import React from 'react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="legal-page"
    >
      <div className="container" style={{ maxWidth: 800 }}>
        <header className="legal-header">
          <h1>Terms & Conditions</h1>
          <p className="last-updated">Last Updated: April 9, 2026</p>
        </header>

        <div className="legal-content">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing our website at TempMail.com, you are agreeing to be bound by these terms of service, 
              all applicable laws and regulations, and agree that you are responsible for compliance with any 
              applicable local laws.
            </p>
          </section>

          <section>
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use the services of TempMail for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, 
              and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose, or for any public display;</li>
              <li>Attempt to decompile or reverse engineer any software contained on TempMail's website;</li>
              <li>Remove any copyright or other proprietary notations from the materials.</li>
            </ul>
          </section>

          <section>
            <h2>3. Disclaimer</h2>
            <p>
              The materials on TempMail's website are provided on an 'as is' basis. TempMail makes 
              no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, 
              without limitation, implied warranties or conditions of merchantability, fitness for a particular 
              purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2>4. Limitations</h2>
            <p>
              In no event shall TempMail or its suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption) arising out 
              of the use or inability to use the materials on TempMail's website.
            </p>
          </section>

          <section>
            <h2>5. Service Limitations</h2>
            <p>
              TempMail is a temporary email service. We do not guarantee the delivery of any email. 
              Emails may be filtered, blocked, or deleted at any time without notice. 
              We are not responsible for any accounts or data lost due to the use of a temporary email address 
              for permanent account creation.
            </p>
          </section>

          <section>
            <h2>6. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of 
              your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
