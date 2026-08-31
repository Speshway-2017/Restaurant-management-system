import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { RestaurantBrandingProvider } from './context/RestaurantBrandingContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RestaurantBrandingProvider>
      <App />
    </RestaurantBrandingProvider>
  </React.StrictMode>,
);
