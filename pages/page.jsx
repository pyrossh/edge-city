import React, { useEffect } from 'react';
import { useRouter } from "parotta/runtime";
import Counter from "@/components/Counter/Counter";
import { Helmet } from 'react-helmet-async';
import "./page.css";

const Page = () => {
  const router = useRouter();
  useEffect(() => {

  }, []);
  return (
    <div>
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
    </div>
  )
}

export default Page;