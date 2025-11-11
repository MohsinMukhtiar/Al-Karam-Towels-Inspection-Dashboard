// src/components/Footer.jsx
import React from "react";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa"; // npm install react-icons
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <hr className="footer-line" />
      <p className="footer-text">
        DESIGNED & DEVELOPED BY MOHSIN <br />
        CONTACT DEVELOPER:{" "}
        <a href="mailto:CodingCaptain34@gmail.com" className="contact-link">
          <FaEnvelope style={{ marginRight: "5px" }} />
          CodingCaptain34@gmail.com
        </a>{" "}
        <br />
        WHATSAPP:{" "}
        <a
          href="https://wa.me/923012119368"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-link"
        >
          <FaWhatsapp style={{ color: "#25D366", marginRight: "5px" }} />
          +92 301 2119368
        </a>
      </p>
    </footer>
  );
}
