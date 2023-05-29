import React from "react";
import { useRouter } from "edge-city";
import { Helmet } from "react-helmet-async";
import { styled } from '@/theme';
import Counter from "@/pages/Counter";

const Heading = styled("h1", {
  color: "$primary",
})

const Container = styled("div", {
  "& .count": {
    color: "black",
    padding: "40px",
    fontSize: "30px",
    fontWeight: 600,
  }
})

export default function Page() {
  const router = useRouter();
  return (
    <div>
      <Helmet>
        <title>Edge City</title>
      </Helmet>
      <Container>
        <Heading>Home Page</Heading>
        <p>Path: {router.pathname}</p>
        <Counter />
      </Container>
    </div>
  );
}
