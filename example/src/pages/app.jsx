import { Suspense } from "react";
import { SSRProvider } from "react-aria";
import { HelmetProvider } from 'react-helmet-async';
import { usePage } from "edge-city/router";
import Layout from "@/components/Layout/Layout";
import "./normalize.css";
import "./spectrum.css";
import "./app.css";

export default function App({ helmetContext }) {
  const Page = usePage();
  return (
    <HelmetProvider context={helmetContext}>
      <SSRProvider>
        <Layout>
          <Suspense fallback={<p>Routing....</p>}>
            <Page />
          </Suspense>
        </Layout>
      </SSRProvider>
    </HelmetProvider>
  );
}