import React, { Suspense } from "react";
import { SWRConfig } from "swr";
import { RouterProvider } from "parotta/router";
import { ErrorBoundary } from "parotta/error";

const App = ({ routerProps, children }) => {
  return (
    <RouterProvider value={routerProps}>
      <SWRConfig value={{
        fallback: {
          'https://jsonplaceholder.typicode.com/todos/1': { id: '123' },
        },
        // fallbackData: null,
        fetcher: (resource, init) => fetch(resource, init).then(res => res.json()), suspense: true
      }}>
        <ErrorBoundary onError={(err) => console.log(err)} fallback={<p>Oops something went wrong</p>}>
          <Suspense fallback={<p>Loading...</p>}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </SWRConfig>
    </RouterProvider>
  )
}

export default App;