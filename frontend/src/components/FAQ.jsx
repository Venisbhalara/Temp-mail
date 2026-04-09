import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_DATA = [
  {
    question: "What is a Temporary Email?",
    answer: "A temporary email (also known as disposable or 10-minute mail) is a short-lived email address that you use for a specific purpose without giving away your real identity. Once you are done, the email and its contents are deleted."
  },
  {
    question: "Is TempMail free to use?",
    answer: "Yes! TempMail is 100% free. We provide high-quality, instant email addresses to help you avoid spam and protect your privacy at no cost."
  },
  {
    question: "How long do the emails stay in the inbox?",
    answer: "Currently, we keep your inbox active for 60 minutes. However, you can refresh or delete it manually at any time. All messages are self-destructed for your security."
  },
  {
    question: "Can I send emails from TempMail?",
    answer: "For security reasons and to prevent abuse (like phishing or spamming), TempMail is a 'receive-only' service. You can view all incoming messages, including OTPs and attachments."
  },
  {
    question: "Do I need to register?",
    answer: "No registration or personal information is required. Just open the site, copy your generated address, and start receiving emails instantly."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="faq-section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {FAQ_DATA.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                {item.question}
                <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="faq-answer-wrapper"
                  >
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
