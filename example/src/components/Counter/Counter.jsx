import React, { useState } from "react";
import { Button } from "react-aria-components";
import "./Counter.css";

const Counter = () => {
  const [count, setCount] = useState(5);
  const increment = () => setCount(count - 1);
  const decrement = () => setCount(count + 1);
  return (
    <div className="counter">
      <Button onPress={increment}>
        -
      </Button>
      <span className="count">{count}</span>
      <Button onPress={decrement}>
        +
      </Button>
    </div>
  );
};

export default Counter;
