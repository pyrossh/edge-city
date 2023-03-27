import { Suspense } from "react";
import { Link, useRouter } from "parotta/router";
import { useFetch } from "parotta/fetch";
// import "./index.css";

export default function Page() {
  const { params } = useRouter();
  const data = useFetch(`/todos/${params.id}`);
  console.log('data', data);
  return (
    <div className="todos-page">
      <h1>Todo no: {params.id}</h1>
    </div>
  )
}