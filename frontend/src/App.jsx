import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ToastStack from "./components/ToastStack";

// Pages
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Disclaimer from "./pages/Disclaimer";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Features from "./pages/Features";

/**
 * ScrollToTop helper component to ensure navigation always starts at the top
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Dynamic Title Management
    const titles = {
      '/': 'Temp Mail — Free Disposable Email Address',
      '/about': 'About Us | TempMail',
      '/features': 'Features & FAQ | TempMail',
      '/privacy-policy': 'Privacy Policy | TempMail',
      '/terms-of-service': 'Terms & Conditions | TempMail',
      '/disclaimer': 'Disclaimer | TempMail',
      '/contact': 'Contact Us | TempMail'
    };
    
    document.title = titles[pathname] || 'TempMail — Disposable Email';
  }, [pathname]);
  
  return null;
}

function Layout() {
  return (
    <div className="app">
      <Navbar />
      
      <main className="main-layout">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
        </Routes>
      </main>

      <Footer />
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Layout />
      </AppProvider>
    </Router>
  );
}
