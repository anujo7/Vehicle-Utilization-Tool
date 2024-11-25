// src/components/Navbar.js
import React from "react";
import "./Navbar.css";
import linqhaulLogo from "../assets/Logo.png"; // Path relative to the file location
import jsplLogo from "../assets/JSPL_logo.png"; // Path relative to the file location

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navlink left">
        <img src={linqhaulLogo} alt="Linqhaul Logo" className="logo" />
      </div>
      <div className="navlink right">
        <img src={jsplLogo} alt="JSPL Logo" className="logo" />
      </div>
    </nav>
  );
};

export default Navbar;
