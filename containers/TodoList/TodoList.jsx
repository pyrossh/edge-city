import React from 'react';
import Todo from "@/components/Todo/Todo";
import { getTodos } from "@/services/todos.service";
import { useRpc } from "parotta/runtime";

const TodoList = () => {
  const { data } = useRpc(getTodos, {});
  return (
    <div className="todo-list">
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            <Todo todo={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;