export const json = async (body, status = 200, headers = {}) => {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    status
  });
}

// const ErrorBoundary = () => {

// }