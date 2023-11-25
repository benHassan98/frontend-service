import {useEffect, useState} from 'react'
import SignUp from './components/SignUp.jsx';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Settings from "./components/Settings.jsx";
import Redirect from "./components/Redirect.jsx";
import Navbar from './components/Navbar.jsx';
import './App.css'
import 'preline';
import {useCookies} from "react-cookie";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import NewPasswordForm from "./components/NewPasswordForm.jsx";
import EmailForm from "./components/EmailForm.jsx";
import Test from "./components/Test.jsx";
import PostPage from "./components/PostPage.jsx";
import {BlobServiceClient} from "@azure/storage-blob";
import Profile from "./components/Profile.jsx";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
function App() {
    const [account,setAccount] = useState(null);
    const [accessToken, setAccessToken] = useState("");
    const [successText,setSuccessText] = useState("");
    const [successFlag, setSuccessFlag] = useState(false);
    const [infoText,setInfoText] = useState("");
    const [infoFlag, setInfoFlag] = useState(false);
    const [dangerText,setDangerText] = useState("");
    const [dangerFlag, setDangerFlag] = useState(false);

    const [,,removeCookie] = useCookies();

    const [stompClient, setStompClient] = useState(null);

    const fetchAccount = async (id)=>{
        const blobServiceClient = new BlobServiceClient(import.meta.env.VITE_BLOB_SAS);
        const containerClient = blobServiceClient.getContainerClient(import.meta.env.VITE_CONTAINER_NAME);


        try{
            const res = await fetch(import.meta.env.VITE_ACCOUNT_SERVICE+'/'+id,{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer  ${accessToken}`
                },
                credentials:"include"
            });

            if(res.status === 200){
                const accountRes = await res.json();
                const blobClient = containerClient.getBlobClient(accountRes.picture);// account.accId/picId
                const blob = await blobClient.download();
                const blobBody = await blob.blobBody;

                accountRes.picture = URL.createObjectURL(blobBody);

                for(let i = 0; i< accountRes.friendList.length;i++){
                    const friend = accountRes.friendList[i];

                    const friendBlobClient = containerClient.getBlobClient(friend.picture);
                    const friendBlob = await friendBlobClient.download();
                    const friendBlobBody = await friendBlob.blobBody;


                    accountRes.friendList[i].picture = URL.createObjectURL(friendBlobBody);

                }

                return accountRes;
            }
            else if(res.status === 401){
               const refRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                    method:"GET",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    credentials:"include"
                });
               if(refRes.status === 200){
                   const data = await res.json();
                   setAccessToken(data.access_token);
                   fetchAccount(id);
               }
               else{
                   removeCookie("refresh_token");
                   removeCookie("JSESSIONID");
                   setAccessToken(null);
                   setAccount(null);
               }


            }
            else {
                console.error(res.statusText);

            }
        }
        catch (e){
            console.error(e);

        }

    };
    const setupSTOMP = (id)=>{

        let socket = new SockJS(import.meta.env.VITE_NOTIFICATIONS_SERVICE+"/notifications/websocket");
        let stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {

            console.log('Connected: ' + frame);

            stompClient.subscribe(`/queue/notifications.${id}`,(req)=>{
                const reqBody = JSON.parse(req);

                console.log(reqBody);



            });


        });

        setStompClient(stompClient);
        };

    const toastsClear = ()=>{
        setSuccessFlag(false);
        setInfoFlag(false);
        setDangerFlag(false);
    };

    const setSuccessToast = (text)=>{
        toastsClear();
        setSuccessFlag(true);
        setSuccessText(text);

    };

    const setInfoToast = (text)=>{
        toastsClear();
        setInfoFlag(true);
        setInfoText(text);
    };

    const setDangerToast = (text)=>{
        toastsClear();
        setDangerFlag(true);
        setDangerText(text);

    };

    useEffect(()=>{
         fetchAccount(1)
             .then( (res)=>{
                 setupSTOMP(res.id);
                 setAccount({
                     ...res
                 });

             })
             .catch(err=>console.error(err));

    },[]);




  return (

        <BrowserRouter>
            <Navbar />
          <Routes>

              <Route path={"/"} element={<Home account={account}/>}/>
              <Route path={"/signup"} element={<SignUp setInfoToast={setInfoToast} />}/>
              <Route path={"/login"} element={<Login setAccount={setAccount} setInfoToast={setInfoToast}  />}/>
              <Route path={"/post/:id"} element={<PostPage account={account} fetchAccount={fetchAccount} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast} />}/>
              <Route path={"/profile/:id"} element={<Profile account={account} setAccount={setAccount} fetchAccount={fetchAccount} notificationStompClient={stompClient} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast} />}/>
              <Route path={"/settings"} element={<Settings account={account} setSuccessToast={setSuccessToast} setInfoToast={setInfoToast} setDangerToast={setDangerToast} />}/>
              <Route path={"/redirect"} element={<Redirect setDangerToast={setDangerToast} setSuccessToast={setSuccessToast}  />    }/>
              <Route path={"/resetPassword"} element={<NewPasswordForm setSuccessToast={setSuccessToast}/>}/>
              <Route path={"/forgetPassword"} element={<EmailForm/>}/>
              <Route path={"/test"} element={<Test/>}/>
          </Routes>

            {
                successFlag &&
                <div
                    id={"success-toast"}
                    className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 fixed bottom-5 right-5 w-[18rem] bg-teal-100 border border-teal-200 text-sm text-teal-800 rounded-lg dark:bg-teal-800/10 dark:border-teal-900 dark:text-teal-500"
                    role="alert">
                    <div className="flex p-4">
                        {successText}
                        <div className="ms-auto">
                            <button
                                data-hs-remove-element="#success-toast"
                                type="button"
                                className="inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-lg text-teal-800 opacity-50 hover:opacity-100 focus:outline-none focus:opacity-100 dark:text-teal-200">
                                <span className="sr-only">Close</span>
                                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            }

            {
                infoFlag &&
                <div
                    id={"info-toast"}
                    className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 fixed bottom-5 right-5 w-[18rem] bg-yellow-100 border border-yellow-200 text-sm text-yellow-800 rounded-lg dark:bg-yellow-800/10 dark:border-yellow-900 dark:text-yellow-500"
                    role="alert">
                    <div className="flex p-4">
                        {infoText}
                        <div className="ms-auto">
                            <button
                                data-hs-remove-element="#info-toast"
                                type="button"
                                className="inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-lg text-yellow-800 opacity-50 hover:opacity-100 focus:outline-none focus:opacity-100 dark:text-yellow-200">
                                <span className="sr-only">Close</span>
                                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24"
                                     height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

            }


            {
                dangerFlag &&
                <div
                    id={"danger-toast"}
                    className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 fixed bottom-5 right-5 w-[18rem] bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg dark:bg-red-800/10 dark:border-red-900 dark:text-red-500"
                    role="alert">
                    <div className="flex p-4">
                        {dangerText}
                        <div className="ms-auto">
                            <button
                                data-hs-remove-element="#danger-toast"
                                type="button"
                                className="inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-lg text-red-800 opacity-50 hover:opacity-100 focus:outline-none focus:opacity-100 dark:text-red-200">
                                <span className="sr-only">Close</span>
                                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24"
                                     height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            }









        </BrowserRouter>

  )
}

export default App
