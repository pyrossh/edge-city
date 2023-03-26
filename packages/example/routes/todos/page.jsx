import { Suspense } from "react";
import TodoList from "@/containers/TodoList/TodoList";
// import "./index.css";

export default function Page() {
  return (
    <div className="todos-page">
      <h1>Todos</h1>
      {/* <Suspense>
        <TodoList todos={todos} />
      </Suspense> */}
    </div>
  )
}