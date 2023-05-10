import React, { useEffect } from 'react';
import { useFetch } from "parotta/fetch";
// import Todo from "@/components/Todo/Todo";
import TodoList from "@/containers/TodoList/TodoList";
import "./page.css";

export const Head = () => {
  return (
    <title>Todos</title>
  )
}

export const Body = () => {
  // const { data, cache } = useFetch("/api/todos");
  // useEffect(() => {
  //   setTimeout(() => {
  //     cache.invalidate(/todos/);
  //   }, 3000)
  // }, []);
  return (
    <div>
      <h1>Todos</h1>
      <ul>
        {/* {data?.map((item) => (
          <li key={item.id}>
            <Todo todo={item} />
          </li>
        ))} */}
        <TodoList />
      </ul>
    </div>
  )
}

