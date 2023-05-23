import React from 'react';
import { Link } from "edge-city";
import "modern-normalize";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <div className="sidebar">
        <Link href="/">Home</Link>
        <Link href="/about">About us</Link>
        <Link href="/todos">Todos</Link>
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  )
}

export default Layout;