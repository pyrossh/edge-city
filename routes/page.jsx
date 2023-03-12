export default () => {
  return (
    <div className="home-page">
      <div>
        <p>
          Hello from server path 123: {router.pathname}
        </p>
        <Suspense fallback={"Loading..."}>
          <TodoList />
        </Suspense>
        <div>
          <button onClick={() => setCount(count - 1)}> -</button>
          <div>
            {count}
          </div>
          <button onClick={() => setCount(count + 1)}> +</button>
        </div>
      </div>
    </div>
  )
}