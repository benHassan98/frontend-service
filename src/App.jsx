import {useContext, useEffect, useState} from 'react'
import SignUp from './components/SignUp.jsx';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Settings from "./components/Settings.jsx";
import Redirect from "./components/Redirect.jsx";
import Navbar from './components/Navbar.jsx';
import Messenger from './components/Messenger.jsx';
import './App.css';
import 'preline';
import {useNavigate, Route, Routes} from "react-router-dom";
import NewPasswordForm from "./components/NewPasswordForm.jsx";
import EmailForm from "./components/EmailForm.jsx";
import Test from "./components/Test.jsx";
import PostPage from "./components/PostPage.jsx";
import Profile from "./components/Profile.jsx";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import {AccessTokenContext} from "./components/AccessTokenProvider.jsx";
import axios from "axios";
import {Toast} from 'flowbite-react';
import {downloadImage} from "./components/FireBaseConfig.js";



function App() {
    const [account,setAccount] = useState(null);
    const [notificationsArr, setNotificationsArr] = useState([]);
    const [successText,setSuccessText] = useState("");
    const [successFlag, setSuccessFlag] = useState(false);
    const [infoText,setInfoText] = useState("");
    const [infoFlag, setInfoFlag] = useState(false);
    const [dangerText,setDangerText] = useState("");
    const [dangerFlag, setDangerFlag] = useState(false);
    const [notificationContent, setNotificationContent] = useState({});
    const [notificationFlag, setNotificationFlag] = useState(false);
    const navigate = useNavigate();




    const {accessToken, setAccessToken, accessTokenIsNull, setAccessTokenIsNull, logout, setLogout} = useContext(AccessTokenContext);



    const [stompClient, setStompClient] = useState(null);


    const signoutRequest = async (accessTokenParam)=>{

        try{
            await axios.post(import.meta.env.VITE_API_URL+"/logout",{
                    access_token:accessTokenParam||accessToken
                },
                {
                    withCredentials:true
                });

        }
        catch (e){
            
                if(e.response.status === 401){
                const refRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                    method:"GET",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    credentials:"include"
                });
                if(refRes.status === 200){
                    const data = await refRes.json();
                    await signoutRequest(data.access_token);
                }
                else{
                  console.error(refRes.statusText);
                }
            }
            else{
                console.error(e.message);

            }


        }



    };


    const fetchLoggedAccount = async (accessTokenParam)=>{

        
        try{
            const res = await axios.post(import.meta.env.VITE_API_URL+"/getUser",{
                    access_token:accessTokenParam||accessToken
                },
                {
                    withCredentials:true
                });

                const accountRes = res.data.account;

                const accountUrl = accountRes.picture;
                
                accountRes.picture = await downloadImage(accountRes.picture);
                
                accountRes.url = accountUrl;

                for(let i = 0; i< accountRes.friendList.length;i++){
                    const friend = accountRes.friendList[i];
                    const friendUrl = friend.picture;

                    accountRes.friendList[i].picture = await downloadImage(friend.picture);
                    accountRes.friendList[i].url = friendUrl;

                }

                setAccessToken(res.data.access_token);
                return res.data;
            
            
        }
        catch (e){
            
                if(e.response.status === 401){
                const refRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                    method:"GET",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    credentials:"include"
                });
                if(refRes.status === 200){
                    const data = await refRes.json();
                    setAccessToken(data.access_token);
                    return await fetchLoggedAccount(data.access_token);
                }
                else{
                    setLogout(true);
                }

            }
            else {
                console.error(e.message);
                throw new Error(e.message);
            }

        }

    };
    const fetchAccount = async (id, accessTokenParam)=>{
        if(!id)return;
        
        const res = await fetch(import.meta.env.VITE_ACCOUNT_SERVICE+'/'+id,{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials:"include"
            });

                if(res.status === 200){


                const accountRes = await res.json();
        
                const accountUrl = accountRes.picture;
                
                accountRes.picture = await downloadImage(accountRes.picture);

                accountRes.url = accountUrl;

                for(let i = 0; i< accountRes.friendList.length;i++){
                    const friend = accountRes.friendList[i];
                    const friendUrl = friend.picture;

                    accountRes.friendList[i].picture = await downloadImage(friend.picture);

                    accountRes.friendList[i].url = friendUrl;

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
                   const data = await refRes.json();
                   setAccessToken(data.access_token);
                   return await fetchAccount(id, data.access_token);
               }
               else{
                   setLogout(true);
               }


            }
            else {
                console.error(res.statusText);
            }
            

    };

    const fetchNotifications = async (id, accessTokenParam)=>{
        try{
            const res = await fetch(import.meta.env.VITE_NOTIFICATIONS_SERVICE+'/notifications/'+id,{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials:"include"
            });



            if(res.status === 200){
                const data = await res.json();
                console.log("notifications: ",data);
                const tempArr = [];

                for(let i = 0;i<data.length;i++){

                    let currId = 0;
                    if(data[i].type === 'AddFriendNotification'){

                        if(data[i].request){ currId = data[i].addingId;}
                        else{ currId = data[i].addedId;}

                    }
                    else {currId = data[i].accountId;}

                    const notificationAccount = await fetchAccount(currId, accessTokenParam);
                    const newNotification = {
                        ...data[i],
                        account:notificationAccount
                    };

                    if(currId !== id){
                        tempArr.push(newNotification);
                    }

                }

                setNotificationsArr([...tempArr.reverse()]);

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
                    const data = await refRes.json();
                    setAccessToken(data.access_token);
                    await fetchNotifications(id, data.access_token);
                }
                else{
                    setLogout(true);
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

        let socket = new SockJS(import.meta.env.VITE_NOTIFICATIONS_SERVICE+"/websocket");
        let stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {

            console.log('Connected: ' + frame);

            stompClient.subscribe(`/queue/notifications.${id}`,async (req)=>{
                const reqBody = JSON.parse(req.body);

                console.log("notifications",reqBody);

                let notificationId;
                const newNotificationContent = {...reqBody};

                if(reqBody.type === 'AddFriendNotification'){
                    notificationId = reqBody.request?reqBody.addingId:reqBody.addedId;
                }
                else {
                    notificationId = reqBody.accountId;
                }



                console.log("notId: ",id);
                console.log("notId: ",notificationId);

                if(notificationId === id){
                    return;
                }



                const notificationAccount =  await fetchAccount(notificationId);


                if(reqBody.type === 'AddFriendNotification'){

                    newNotificationContent.url = notificationAccount.picture;
                    newNotificationContent.userName = notificationAccount.userName;
                    newNotificationContent.text = reqBody.request?"sent you a friend request":"accepted your friend request";

                }
                else if(reqBody.type === 'NewPostNotification'){

                    newNotificationContent.url = notificationAccount.picture;
                    newNotificationContent.userName = notificationAccount.userName;
                    newNotificationContent.text = (reqBody.created?"created ":"shared ")+'a new Post';


                }
                else if(reqBody.type === 'NewCommentNotification'){

                    newNotificationContent.url = notificationAccount.picture;
                    newNotificationContent.userName = notificationAccount.userName;
                    newNotificationContent.text = 'commented on your post';


                }
                else if(reqBody.type === 'NewLikeNotification'){

                    newNotificationContent.url = notificationAccount.picture;
                    newNotificationContent.userName = notificationAccount.userName;
                    newNotificationContent.text = 'Liked your post';


                }
                else{

                    newNotificationContent.url = notificationAccount.picture;
                    newNotificationContent.userName = notificationAccount.userName;
                    newNotificationContent.text = 'sent you a message';
                }

                setNotificationToast(newNotificationContent);
                setNotificationsArr(prevState => [{
                    ...reqBody,
                    account:notificationAccount
                }, ...prevState])

            });


        });

        setStompClient(stompClient);
        };

    const respondToFriendRequest = async (addingId, isAccepted)=>{
        stompClient.send(
            "/app/addFriend",
            {},
            JSON.stringify({
                addingId,
                addedId:account?.id,
                isRequest:false,
                isAccepted
            }));

        if(isAccepted){
            const newFriend = await fetchAccount(addingId);

            const newFriendArr = account?.friendList;
            newFriendArr.push(newFriend);

            const newFollowerArr = account?.followerList;
            newFollowerArr.push(newFriend.id);

            setAccount({
                ...account,
                friendList:newFriendArr,
                followerList:newFollowerArr
            });
        }

        setNotificationsArr(prevState => [...prevState.
        filter(
            notification=>
                !(notification.type === 'AddFriendNotification' && notification.addingId === addingId && notification.addedId === account?.id)
        )
        ])
    };

    const toastsClear = ()=>{
        setNotificationFlag(false);
        setSuccessFlag(false);
        setInfoFlag(false);
        setDangerFlag(false);
    };

    const setNotificationToast = (content)=>{
        toastsClear();
        setNotificationFlag(true);
        setNotificationContent({...content});
    }

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

        console.log("accessToken: ",accessToken);
        
        fetchLoggedAccount()
                            .then(resObj=>{
                                    const accountRes = resObj.account;
                                    const accessTokenParam = resObj.access_token;
                                    setAccount({...accountRes});
                                    fetchNotifications(accountRes.id, accessTokenParam)
                                    .then(()=>{
                                            setupSTOMP(accountRes.id);     
                                    });

                            })
                            .catch(e=>{
                                        console.error(e.message);
                                        navigate("/login");
                            });
        
        

        


    },[accessTokenIsNull]);

    useEffect(()=>{
        if(logout){
            ( async ()=>{

                await signoutRequest();
                window.location.reload();
                
            })();
        }
    },[logout]);



  return (
      <>
            {
            Boolean(account) &&
            <>
                  <Navbar account={account} setAccount={setAccount} setNotificationsStompClient={setStompClient} fetchAccount={fetchAccount} notificationsArr={notificationsArr} setNotificationsArr={setNotificationsArr} respondToFriendRequest={respondToFriendRequest} />
                  
                  <Messenger account={account} />
            </>
            }
          <Routes>
              <Route path={"/signup"} element={<SignUp setInfoToast={setInfoToast} />}/>
              <Route path={"/login"} element={<Login setAccount={setAccount} fetchAccount={fetchLoggedAccount} setAccessToken={setAccessToken} setAccessTokenIsNull={setAccessTokenIsNull}/>}/>
              <Route path={"/forgetPassword"} element={<EmailForm setInfoToast={setInfoToast} setDangerToast={setDangerToast}  />}/>
              <Route path={"/redirect/:type"} element={<Redirect setDangerToast={setDangerToast} setSuccessToast={setSuccessToast}  />    }/>
              <Route path={"/resetPassword"} element={<NewPasswordForm setSuccessToast={setSuccessToast}/>}/>
              <Route path={"/test"} element={<Test/>}/>
              {
                  Boolean(account) &&
                  <>
                      <Route path={"/"} element={<Home account={account} fetchAccount={fetchAccount} notificationStompClient={stompClient} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast}/>}/>
                      <Route path={"/post/:id"} element={<PostPage account={account} fetchAccount={fetchAccount} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast} />}/>
                      <Route path={"/profile/:id"} element={<Profile account={account} setAccount={setAccount} fetchAccount={fetchAccount} notificationStompClient={stompClient} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast} />}/>
                      <Route path={"/settings"} element={<Settings account={account} fetchAccount={fetchAccount} setAccount={setAccount} setSuccessToast={setSuccessToast} setInfoToast={setInfoToast} setDangerToast={setDangerToast} />}/>

                  </>
              }

          </Routes>

            {
                notificationFlag &&
                <Toast>

                    <div
                        className="fixed bottom-5 right-5 w-[18rem] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700"
                        role="alert">
                        <div className="flex p-4">
                            <div className="flex-shrink-0">
                                <img className="inline-block h-10 w-10 rounded-full"
                                     src={notificationContent.url}
                                     alt="Image Description"/>
                            </div>
                            <div className={"ms-4 me-5"} >
                                <h3
                                    onClick={()=>{
                                        if(notificationContent.type !== "AddFriendNotification" && notificationContent.type !== "NewMessageNotification"){
                                            navigate("/post/"+notificationContent.postId);
                                            setNotificationFlag(false);
                                        }

                                    }}
                                    className={
                                        (notificationContent.type !== "AddFriendNotification" && notificationContent.type !== "NewMessageNotification"?
                                            "cursor-pointer ":"")+
                                    "text-gray-800 font-medium text-sm dark:text-white"}>
                                    <span className="font-semibold">{notificationContent.userName}</span> {notificationContent.text}
                                </h3>
                                {
                                    Boolean(notificationContent.type === "AddFriendNotification" && notificationContent.request) &&
                                    <div className="flex space-x-3 mt-1">
                                        <button
                                            onClick={()=>{
                                                setNotificationFlag(false);
                                                respondToFriendRequest(notificationContent.addingId, true);

                                            }}
                                            type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                            Accept
                                        </button>
                                        <button
                                            onClick={()=>{
                                                setNotificationFlag(false);
                                                respondToFriendRequest(notificationContent.addingId, false);

                                            }}
                                            type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                            Reject
                                        </button>
                                    </div>
                                }
                            </div>
                            <Toast.Toggle onDismiss={()=>setNotificationFlag(false)}/>
                        </div>
                    </div>

                </Toast>

            }




            {
                successFlag &&
                <Toast>
                    <div
                        className="fixed bottom-5 right-5 w-[18rem] bg-teal-100 border border-teal-200 text-sm text-teal-800 rounded-lg dark:bg-teal-800/10 dark:border-teal-900 dark:text-teal-500"
                        role="alert">
                        <div className="flex p-4">
                            {successText}
                            <div className="ms-auto">
                                <Toast.Toggle onDismiss={()=>setSuccessFlag(false)}/>
                            </div>
                        </div>
                    </div>
                </Toast>
            }

            {
                infoFlag &&
                <Toast>
                    <div
                        className="fixed bottom-5 right-5 w-[18rem] bg-yellow-100 border border-yellow-200 text-sm text-yellow-800 rounded-lg dark:bg-yellow-800/10 dark:border-yellow-900 dark:text-yellow-500"
                        role="alert">
                        <div className="flex p-4">
                            {infoText}
                            <div className="ms-auto">
                                <Toast.Toggle onDismiss={()=>setInfoFlag(false)} />
                            </div>
                        </div>
                    </div>
                </Toast>

            }


            {
                dangerFlag &&
                <Toast>
                    <div
                        className="fixed bottom-5 right-5 w-[18rem] bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg dark:bg-red-800/10 dark:border-red-900 dark:text-red-500"
                        role="alert">
                        <div className="flex p-4">
                            {dangerText}
                            <div className="ms-auto">
                                <Toast.Toggle onDismiss={()=>setDangerFlag(false)} />
                            </div>
                        </div>
                    </div>
                </Toast>
            }

      </>

  )
}

export default App
