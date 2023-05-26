import { SSRProvider } from 'react-aria';

const App = ({ children }) => {
  return (
    <SSRProvider>
      {children}
    </SSRProvider>
  )
}

export default App;
