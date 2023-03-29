import { Suspense } from "react";
import { Link, useRouter } from "parotta/router";
import { useFetch } from "parotta/fetch";

export const Head = () => {
  const { params } = useRouter();
  return (
    <title>Todo: {params.id}</title>
  )
}

export const Body = () => {
  const { params } = useRouter();
  const data = useFetch(`/todos/${params.id}`);
  console.log('data', data);
  return (
    <div>
      <h1>Todo no: {params.id}</h1>
    </div>
  )
}