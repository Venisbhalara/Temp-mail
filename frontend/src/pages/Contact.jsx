import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
  const [formState, setFormState] = useState("idle"); // idle, sending, success
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormState("sending");

    // Simulate API call
    setTimeout(() => {
      setFormState("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="contact-page"
    >
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="contact-grid">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="contact-info"
          >
            <span className="badge">Get in Touch</span>
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-description">
              Have questions, feedback, or need help with TempMail? Our team is
              here to support you. Fill out the form and we'll get back to you
              as soon as possible.
            </p>

            <div className="contact-details">
              <div className="detail-item">
                <div className="detail-icon">📧</div>
                <div className="detail-text">
                  <h3>Email</h3>
                  <p>support@tempmail.com</p>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-icon">⏱️</div>
                <div className="detail-text">
                  <h3>Response Time</h3>
                  <p>Within 24-48 hours</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="contact-form-card"
          >
            <AnimatePresence mode="wait">
              {formState === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="contact-success"
                >
                  <div className="success-icon">✅</div>
                  <h2>Message Sent!</h2>
                  <p>
                    Thank you for reaching out. We have received your message
                    and will get back to you shortly.
                  </p>
                  <button
                    className="btn btn--primary"
                    onClick={() => setFormState("idle")}
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="contact-form"
                >
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="vasu..."
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="vasu@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows="5"
                      placeholder="Your message here..."
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn--primary btn--full"
                    disabled={formState === "sending"}
                  >
                    {formState === "sending" ? "Sending..." : "Send Message"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
