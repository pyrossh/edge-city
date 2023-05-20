import React, { useEffect } from 'react';
import { useRouter, renderPage } from "parotta-runtime";
import Layout from '@/components/Layout/Layout';
import Counter from "@/components/Counter/Counter";
import { Helmet } from 'react-helmet-async';
import "./page.css";

const Page = () => {
  const router = useRouter();
  useEffect(() => {

  }, []);
  return (
    <Layout>
      <Helmet>
        <title>Parotta App</title>
      </Helmet>
      <div>
        <h1>Home Page</h1>
        <p>
          Path: {router.pathname}
        </p>
        <Counter />
      </div>
    </Layout>
  )
}

export default Page;

export function onRequest(context) {
  return renderPage(Page, context.request);
}