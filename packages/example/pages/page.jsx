import React, { useEffect } from 'react';
import { useRouter } from "parotta-runtime";
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
      <div className="home-page">
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
