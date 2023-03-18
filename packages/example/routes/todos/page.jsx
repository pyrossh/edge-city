import { Suspense } from "react";
import { useRouter } from "muffinjs/router.js";
import TodoList from "@/containers/TodoList.jsx";
// import "./index.css";

export default () => {
  const router = useRouter();
  const { data: todos, isRevalidating } = usePromise("/todos");
  return (
    <div className="todos-page">
      <Suspense>
        <TodoList todos={todos} />
      </Suspense>
    </div>
  )
}