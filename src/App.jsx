import { useState, useEffect, useRef } from 'react'
import SignUp from './components/SignUp.jsx';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Settings from "./components/Settings.jsx";
import Post from "./components/Post.jsx";
import Redirect from "./components/Redirect.jsx";
import Navbar from './components/Navbar.jsx';
import './App.css'
import 'preline';
import {useCookies} from "react-cookie";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import NewPasswordForm from "./components/NewPasswordForm.jsx";
import EmailForm from "./components/EmailForm.jsx";
import Test from "./components/Test.jsx";
import dumb from "./../public/dumb.jpg";
import PostPage from "./components/PostPage.jsx";

function App() {
    const [account,setAccount] = useState({
        email:'example@gmail.com',
        fullName:"Ibrahim Al White",
        userName:"HemaWhite",
        isVerified:true,
        image:dumb,
        aboutMe:"Basically nothing"
    });
    const [accessToken, setAccessToken] = useState(null);
    const [toastText,setToastText] = useState("");
    const [successText,setSuccessText] = useState("");
    const [infoText,setInfoText] = useState("");
    const [dangerText,setDangerText] = useState("");
    const toastRef = useRef();
    const successRef = useRef();
    const infoRef = useRef();
    const dangerRef = useRef();
    const [cookies] = useCookies(['XSRF-TOKEN']);
    const fetchAccount = async ()=>{
        return {};
    };


    const toastsClear = ()=>{
        toastRef.current.classList.remove("notification-transform");
        successRef.current.classList.remove("notification-transform");
        infoRef.current.classList.remove("notification-transform");
        dangerRef.current.classList.remove("notification-transform");
    };

    const setToast = (text)=>{
        toastsClear();
        toastRef.current.classList.add("notification-transform");
        setToastText(text);
    };

    const setSuccessToast = (text)=>{
        toastsClear();
        successRef.current.classList.add("notification-transform");
        setSuccessText(text);

    };

    const setInfoToast = (text)=>{
        toastsClear();
        infoRef.current.classList.add("notification-transform");
        setInfoText(text);

    };

    const setDangerToast = (text)=>{
        toastsClear();
        dangerRef.current.classList.add("notification-transform");
        setDangerText(text);

    };

    // useEffect(()=>{
    //     console.log("Cookies: ",cookies);
    //     fetch(import.meta.env.VITE_API_URL+"/account",{
    //         method:"GET",
    //         headers:{
    //             "Content-Type": "application/json",
    //             "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
    //         },
    //         credentials:"include"
    //     })
    //         .then( async (res)=>{
    //             const isJson = res.headers
    //                 .get("content-type")
    //                 .includes("application/json");
    //
    //             const data = isJson ? await res.json() : null;
    //             if(res.status === 200){
    //                 setAccount(data.account);
    //             }
    //             else{
    //                 return Promise.reject(res.status);
    //             }
    //
    //         })
    //         .catch(err=>console.error(err));
    //
    // },[]);



  return (

        <BrowserRouter>
            <Navbar />
          <Routes>

              <Route path={"/"} element={<Home account={account}/>}/>
              <Route path={"/signup"} element={<SignUp setInfoToast={setInfoToast} />}/>
              <Route path={"/login"} element={<Login setAccount={setAccount} setInfoToast={setInfoToast}  />}/>
              <Route path={"/post/:id"} element={<PostPage account={account} fetchAccount={fetchAccount} />}/>
              <Route path={"/settings"} element={<Settings account={account} setSuccessToast={setSuccessToast} setInfoToast={setInfoToast} setDangerToast={setDangerToast} />}/>
              <Route path={"/redirect"} element={<Redirect setDangerToast={setDangerToast} setSuccessToast={setSuccessToast}  />    }/>
              <Route path={"/resetPassword"} element={<NewPasswordForm setSuccessToast={setSuccessToast}/>}/>
              <Route path={"/forgetPassword"} element={<EmailForm/>}/>
              <Route path={"/test"} element={<Test/>}/>
          </Routes>
            <div id="toast-success"
                 className="notification fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
                 role="alert"
                 ref={successRef}
            >
                <div
                    className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                         viewBox="0 0 20 20">
                        <path
                            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                    </svg>
                    <span className="sr-only">Check icon</span>
                </div>
                <div className="ml-3 text-sm font-normal">{successText}</div>
                <button type="button"
                        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                        aria-label="Close"
                        onClick={()=>{successRef.current.classList.toggle("notification-transform")}}

                >
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                </button>
            </div>
            <div id="toast-danger"
                 className="notification fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
                 role="alert"
                 ref={dangerRef}
            >
                <div
                    className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                         viewBox="0 0 20 20">
                        <path
                            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
                    </svg>
                    <span className="sr-only">Error icon</span>
                </div>
                <div className="ml-3 text-sm font-normal">{dangerText}</div>
                <button type="button"
                        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                        aria-label="Close"
                        onClick={()=>dangerRef.current.classList.toggle("notification-transform")}
                >
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                </button>
            </div>
            <div id="toast-info"
                 className="notification fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
                 role="alert"
                 ref={infoRef}
            >
                <div
                    className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-orange-500 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                         viewBox="0 0 20 20">
                        <path
                            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
                    </svg>
                    <span className="sr-only">Warning icon</span>
                </div>
                <div className="ml-3 text-sm font-normal">{infoText}</div>
                <button type="button"
                        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                        aria-label="Close"
                        onClick={()=>infoRef.current.classList.toggle("notification-transform")}
                >
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                </button>
            </div>

        </BrowserRouter>

  )
}

export default App
