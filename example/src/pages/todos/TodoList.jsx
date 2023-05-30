import React from "react";
import { useQuery } from "edge-city";
import { getTodos } from "@/services/todos.service";
import Todo from "./Todo";
import "./page.css";

export default function TodoList({ isMutating }) {
  const { data, isRefetching } = useQuery("todos", () => getTodos());
  return (
    <>
      {isMutating || isRefetching ? <p>Loading...</p> : null}
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
