import { getTodos } from "@/services/todos.service";

const todos = await getTodos();
console.log(todos);