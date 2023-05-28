import React from "react";
import { useRouter } from "edge-city";
import { Helmet } from "react-helmet-async";
import { styled } from '@/theme';
import Counter from "@/components/Counter/Counter";
import "./page.css";

const Heading = styled("h1", {
  color: "$primary",
})

export default function Page() {
  const router = useRouter();
  return (
    <div>
      <Helmet>
        <title>Edge City</title>
      </Helmet>
      <div className="home-page">
        <Heading>Home Page</Heading>
        <p>Path: {router.pathname}</p>
        <Counter />
      </div>
    </div>
  );
}
