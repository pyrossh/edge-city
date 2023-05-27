import { SSRProvider } from 'react-aria';
import Layout from '@/components/Layout/Layout';
import "./app.css";

const App = ({ children }) => {
  return (
    <SSRProvider>
      <Layout>
        {children}
      </Layout>
    </SSRProvider>
  )
}

export default App;
