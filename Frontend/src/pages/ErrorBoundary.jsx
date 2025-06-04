import React from 'react';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, color: 'red' }}>
        <h2>Terjadi kesalahan saat memuat aplikasi</h2>
        <p>{this.state.error?.message}</p>
      </div>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
