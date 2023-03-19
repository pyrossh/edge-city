import { useState } from "react";
// import { useRouter } from "muffinjs/router.js";
import "./page.css";

const HomePage = () => {
  // const router = useRouter();
  const [count, setCount] = useState(5);
  return (
    <div className="home-page">
      <div>
        <h1>Home Page</h1>
        {/* <p>
          Hello from server path 123: {router.pathname}
        </p> */}
        <div>
          <button onClick={() => setCount(count - 1)}>-</button>
          <span className="count">
            {count}
          </span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
      </div>
    </div>
  )
}

export default HomePage;