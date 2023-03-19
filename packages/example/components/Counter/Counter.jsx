import { useState } from "react";

const Counter = () => {
  const [count, setCount] = useState(5);
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span className="count">
        {count}
      </span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}

export default Counter;