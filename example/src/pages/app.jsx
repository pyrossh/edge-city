import { Suspense } from "react";
import { SSRProvider } from "react-aria";
import Layout from "@/components/Layout/Layout";
import "./normalize.css";
import "./spectrum.css";
import "./app.css";

export default function App({ children }) {
  return (
    <SSRProvider>
      <Layout>
        <Suspense fallback={<p>Loading...</p>}>
          {children}
        </Suspense>
      </Layout>
    </SSRProvider>
  );
}