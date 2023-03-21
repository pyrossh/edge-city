import React from 'react';

const changedArray = (a = [], b = []) =>
  a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))

export class ErrorBoundary extends React.Component {
  // static propTypes = {
  //   resetKeys: PropTypes.arrayOf(PropTypes.any),
  // }
  static getDerivedStateFromError(error) {
    return { error }
  }

  state = {}

  componentDidCatch(error, info) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps, prevState) {
    const { error } = this.state
    const { resetKeys } = this.props
    if (
      error !== null &&
      prevState.error !== null &&
      changedArray(prevProps.resetKeys, resetKeys)
    ) {
      this.setState({});
    }
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (error) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }
    }
    return children;
  }
}