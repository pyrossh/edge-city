import React, { Suspense } from "react";
import { SWRConfig } from "swr";
import { RouterProvider } from "parotta/router";
import { ErrorBoundary } from "parotta/error";

const App = ({ routerProps, children }) => {
  return (
    <SWRConfig value={{
      fallback: {
        'https://jsonplaceholder.typicode.com/todos/1': { id: '123' },
      },
      // fallbackData: null,
      fetcher: (resource, init) => fetch(resource, init).then(res => res.json()), suspense: true
    }}>
      <ErrorBoundary onError={(err) => console.log(err)} fallback={<p>Oops something went wrong</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <RouterProvider value={routerProps}>
            {children}
          </RouterProvider>
        </Suspense>
      </ErrorBoundary>
    </SWRConfig>
  )
}

export default App;