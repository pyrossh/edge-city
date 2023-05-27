import { SSRProvider } from 'react-aria';
import Layout from '@/components/Layout/Layout';

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
