import React from 'react';
import { Link } from "parotta/runtime";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div>
      <header className="layout-header">
        <Link href="/about">About us</Link>
        <Link href="/todos">Todos</Link>
      </header>
      <div>
        {children}
      </div>
    </div>
  )
}

export default Layout;