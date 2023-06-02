import React from "react";
import { useQuery } from "edge-city/data";
import { getTodos } from "@/services/todos.service";
import Spinner from "@/components/Spinner/Spinner";
import Todo from "./Todo";
import "./page.css";

export default function TodoList({ isMutating }) {
  const { data, isRefetching } = useQuery("todos", () => getTodos());
  return (
    <>
      {isMutating || isRefetching ? <Spinner /> : null}
      <ul>
        {data.map((item) => (
          <Todo
            key={item.id}
            item={item}
          />
        ))}
      </ul>
    </>
  );
}
