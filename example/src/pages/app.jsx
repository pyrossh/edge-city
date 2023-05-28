import { SSRProvider } from "react-aria";
import { Link } from "edge-city";
import { styled } from '@/theme';
import "./normalize.css";
import "./spectrum.css";
import "./app.css";

const Container = styled("div", {
  display: "flex",
  marginLeft: "20%",
})

const Sidebar = styled("div", {
  display: "flex",
  flexShrink: 0,
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  paddingTop: "42px",
  lineHeight: "1.8em",
  '&a': {
    marginRight: "20px",
  }
})

const Content = styled("div", {
  display: "flex",
  flex: "1",
  padding: "20px",
  paddingBottom: "50px",
  borderLeft: "2px solid #eee",
  minHeight: "100vh",
})

export default function App({ children }) {
  return (
    <SSRProvider>
      <Container>
        <Sidebar>
          <Link href="/">Home</Link>
          <Link href="/about">About us</Link>
          <Link href="/todos">Todos</Link>
        </Sidebar>
        <Content>{children}</Content>
      </Container>
    </SSRProvider>
  );
}