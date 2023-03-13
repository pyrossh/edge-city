<!--js-->
import { useState } from "react";
import { useRouter } from "@/router.js";
import TodoList from "@/containers/TodoList.astro";

const router = useRouter();
const [count, setCount] = useState(5);
// const { data: todos, isLoading, isRevalidating } = usePromise("/todos");

<!--jsx-->
<div>
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