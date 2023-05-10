import React, { Suspense } from 'react';
import { Link } from "parotta/runtime";
import { ErrorBoundary } from "parotta/runtime";
import "./layout.css";

const Layout = ({ children }) => {
  return (
    <ErrorBoundary onError={(err) => console.log(err)} fallback={<p>Oops something went wrong</p>}>
      <header className="layout-header">
        <Link href="/about">About us</Link>
        <Link href="/todos">Todos</Link>
      </header>
      <Suspense fallback={<p>Loading...</p>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default Layout;