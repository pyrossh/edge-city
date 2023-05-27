import { SSRProvider } from "react-aria";
import Layout from "@/components/Layout/Layout";
import "./app.css";

export default function App({ children }) {
  return (
    <SSRProvider>
      <Layout>{children}</Layout>
    </SSRProvider>
  );
}
