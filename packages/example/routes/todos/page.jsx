import { Suspense } from "react";
import { useRouter } from "muffinjs/router.js";
import TodoList from "@/containers/TodoList.jsx";
// import "./index.css";

const TodosPage = () => {
  const router = useRouter();
  const { data: todos, isRevalidating } = usePromise("/todos");
  return (
    <div className="todos-page">
      <h1>Todos</h1>
      <Suspense>
        <TodoList todos={todos} />
      </Suspense>
    </div>
  )
}

export default TodosPage;