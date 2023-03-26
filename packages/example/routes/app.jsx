import React, { Suspense } from "react";
import { ErrorBoundary } from "parotta/error";

export default function App({ children }) {
  console.log('app');
  return (
    <ErrorBoundary onError={(err) => console.log(err)} fallback={<p>Oops something went wrong</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}