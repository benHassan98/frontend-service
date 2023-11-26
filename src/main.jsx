import React from 'react';
import {AccessTokenProvider} from "./components/AccessTokenProvider.jsx";
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {CookiesProvider} from "react-cookie";
import {Flowbite, DarkThemeToggle} from "flowbite-react";


ReactDOM.createRoot(document.getElementById('root')).render(

  <CookiesProvider>
      <AccessTokenProvider>
          <Flowbite>
              <DarkThemeToggle value={"dark"} disabled={true} hidden={true} />
    <App />
          </Flowbite>
      </AccessTokenProvider>
  </CookiesProvider>
  ,
);
