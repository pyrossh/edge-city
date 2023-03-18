import Todo from "@/example/components/Todo.jsx";

const todos = [
  { id: '1', text: "123" },
  { id: '2', text: "AEQ" }
];

const TodoList = () => {
  return (
    <div className="todo-list">
      <h1>Todos</h1>
      <ul>
        {todos.map((item) => (
          <li key={item.text}>
            <Todo id={item.id} text={item.text} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
