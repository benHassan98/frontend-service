import React from 'react';
import {AccessTokenProvider} from "./components/AccessTokenProvider.jsx";
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {CookiesProvider} from "react-cookie";


ReactDOM.createRoot(document.getElementById('root')).render(

  <CookiesProvider>
      <AccessTokenProvider>
    <App />
      </AccessTokenProvider>
  </CookiesProvider>
  ,
);
