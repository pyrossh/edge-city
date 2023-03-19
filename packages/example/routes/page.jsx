import Counter from "@/components/Counter/Counter";
// import { useRouter } from "muffinjs/router.js";
import "./page.css";

const HomePage = () => {
  // const router = useRouter();
  return (
    <div className="home-page">
      <div>
        <h1>Home Page</h1>
        {/* <p>
          Path: {router.pathname}
        </p> */}
        <Counter />
      </div>
    </div>
  )
}

export default HomePage;