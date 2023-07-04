// import { useState } from 'react'
import SignUp from './pages/SignUp.jsx';
import './App.css'
import {CookiesProvider} from "react-cookie";
import {BrowserRouter, Route, Routes} from "react-router-dom";

function App() {


  return (
      <CookiesProvider>
        <BrowserRouter>
          <Routes>
              <Route path={"/"} element={<SignUp/>}/>
          </Routes>
        </BrowserRouter>
      </CookiesProvider>
  )
}

export default App
