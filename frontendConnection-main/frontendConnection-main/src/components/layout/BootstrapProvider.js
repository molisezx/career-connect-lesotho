// src/components/layout/BootstrapProvider.js
import { SSRProvider } from 'react-bootstrap';

const BootstrapProvider = ({ children }) => {
  return (
    <SSRProvider>
      {children}
    </SSRProvider>
  );
};

export default BootstrapProvider;
