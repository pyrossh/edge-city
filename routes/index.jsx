import { useState } from "react";
import { useRouter } from "@/router.js";
import TodoList from "@/containers/TodoList.astro";
import "index.css";

const { name, title } = props;
const router = useRouter();
const [count, setCount] = useState(5);
// const { data: todos, isLoading, isRevalidating } = usePromise("/todos");

return (
  <div className="container">
    <div>
      <p>
        Hello from server path 123: {router.pathname}
      </p>
      <TodoList />
      <div>
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>
          {count}
        </span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  </div>
);