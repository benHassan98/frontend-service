import {useContext, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import TimeAgo from 'react-timeago';
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";


function Navbar({account, fetchAccount, notificationsArr, setNotificationsArr, respondToFriendRequest}) {

    const [accountsArr, setAccountsArr] = useState([]);
    const [searchText, setSearchText] = useState("");
    const navigate = useNavigate();
    const {accessToken, setAccessToken, logout, setLogout} = useContext(AccessTokenContext);

    const [stompClient, setStompClient] = useState(null);


    const setupStomp = ()=>{

        let socket = new SockJS(import.meta.env.VITE_ACCOUNT_SERVICE+"/websocket");
        let stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {

            console.log('Connected: ' + frame);

            stompClient.subscribe(`/exchange/accountSearch/${account?.id}`,async (req)=> {
                const reqBody = JSON.parse(req.body);

                console.log("searchResults: ",reqBody);
                const temp = [];

                for(let i =0;i<reqBody.length;i++){
                    const searchAccount = await fetchAccount(reqBody[i]);

                    temp.push(searchAccount);

                }

                setAccountsArr([...temp]);

            });


            });

        setStompClient(stompClient);
    };
    const searchRequest = (searchContent)=>{
        stompClient.send(
            "/app/accountSearch/"+account?.id,
            {},
            JSON.stringify({
                searchText:searchContent
            })
            );
    };

    const setNotificationsAsViewed = (accessTokenParam)=>{


        fetch(import.meta.env.VITE_NOTIFICATIONS_SERVICE+"/notifications/view/"+account?.id,{
            method:"GET",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
            },
            credentials:"include"
        })
            .then(async (res) => {

                if (res.status === 200) {
                    setNotificationsArr(prevState=>[...prevState.map(n=>({...n,viewed:true}))]);
                } else if (res.status === 401) {

                    fetch(import.meta.env.VITE_REFRESH_TOKEN, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include"
                    })
                        .then(async (res) => {
                            if (res.status === 200) {
                                const data = await res.json();
                                setAccessToken(data.access_token);
                                setNotificationsAsViewed(data.access_token);
                            } else {
                                setLogout(true);
                            }

                        })
                        .catch(err => console.error(err));

                } else {
                    throw new Error(res.statusText);
                }


            })
            .catch(err => console.error(err));


    };
    const signOut = ()=>{
        setLogout(true);
    }

    useEffect(()=>{

        if(account ){
            setupStomp();
        }


    },[account]);

    useEffect(()=>{
        if(logout){
            stompClient?.disconnect();
        }
    },[logout]);


    useEffect(()=>{
        if(searchText){
            searchRequest(searchText);
        }


    },[searchText]);

    return(
// <div className="flex flex-col">
        <nav className="sticky top-0 z-50 shadow bg-gray-900">
            <div className="container px-6 py-4 mx-auto">
                <div className="lg:flex lg:items-center lg:justify-between">
                    <div className="flex items-center justify-between">
                        <Link to="/">
                            <h1 className="text-white text-4xl">Odin Book</h1>
                        </Link>


                    </div>
                    { Boolean(account) &&
                        <>
                        <div className="flex flex-col w-96">
                            <div>
                                <label htmlFor="default-search"
                                       className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                                                  strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                        </svg>
                                    </div>
                                    <input type="search" id="default-search"
                                           className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white "
                                           placeholder="Search Users..."
                                           onKeyUp={(e)=>setSearchText(e.currentTarget.value)}
                                           onBlur={()=>setAccountsArr([])}
                                    />

                                </div>
                            </div>

                            {
                                Boolean(accountsArr.length) &&
                                <div className="absolute z-20 mt-16 overflow-hidden rounded-md shadow-lg  bg-gray-800">
                                    {
                                        accountsArr.map(searchAccount=>{

                                            return(
                                                <div
                                                    key={`search-${searchAccount.id}`}
                                                    onClick={()=>navigate("/profile/"+searchAccount.id)}
                                                    className="cursor-pointer flex items-center px-4 py-3 -mx-2 border-b border-gray-100 dark:border-gray-700 w-[25rem]">
                                                    <img className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                         src={searchAccount.picture}
                                                         alt="avatar"/>
                                                    <p className="mx-2 text-sm text-gray-600 dark:text-white">{searchAccount.userName}</p>
                                                </div>
                                            );
                                        })
                                    }

                                </div>
                            }


                        </div>



                        <div
                            className="absolute inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-gray-800 lg:mt-0 lg:p-0 lg:top-0 lg:relative lg:bg-transparent lg:w-auto lg:opacity-100 lg:translate-x-0 lg:flex lg:items-center">


                            <div className="flex items-center mt-4 lg:mt-0">


                                <button type="button" className="flex items-center focus:outline-none"
                                        aria-label="toggle profile dropdown">
                                    <div
                                        className="w-10 h-10 overflow-hidden rounded-full">
                                        <img
                                            src={account?.picture}
                                            className="object-cover w-full h-full" alt="avatar"/>
                                    </div>

                                    <h3 className="px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{account?.userName}</h3>
                                </button>

                                <div className="hs-dropdown relative inline-block [--placement:bottom]">

                                    <button
                                        onClick={()=>{
                                            if(notificationsArr.length && !notificationsArr[0].viewed){
                                                setNotificationsAsViewed();
                                            }
                                        }}
                                        className="hs-dropdown-toggle relative z-10 block p-2 text-gray-700 border border-transparent rounded-md dark:text-white focus:border-blue-500 focus:ring-opacity-40 dark:focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-400 focus:ring bg-gray-900 focus:outline-none mr-2">

                                        {
                                             Boolean( Boolean(notificationsArr.length) &&!notificationsArr[0].viewed) &&
                                            <span
                                                className="absolute top-0 end-0 inline-flex items-center w-3.5 h-3.5 rounded-full border-2 border-white text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-red-500 text-white dark:border-slate-900">
                                            </span>
                                        }
                                        <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg"
                                             width="24" height="24" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                             strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                                        </svg>
                                    </button>


                                    <div
                                        className="absolute hs-dropdown-menu hs-dropdown-open:opacity-100 w-72 transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden z-20 transition-[margin,opacity] opacity-0 duration-300 mt-2 min-w-[15rem] bg-white shadow-md rounded-lg p-2 dark:bg-gray-800 dark:border dark:border-gray-700 dark:divide-gray-700 h-64 overflow-y-auto"
                                    >
                                        <div className="py-2">
                                            {
                                                notificationsArr.map(notification=>{

                                                    if(notification.type === 'AddFriendNotification'){
                                                       if(notification.request){
                                                           return (
                                                               <div
                                                                   key={`notification-${notification.id}`}
                                                                   className="flex flex-col items-center px-4 py-3 -mx-2 border-b border-gray-100 dark:border-gray-700">
                                                                   <div className={"flex "}>
                                                                       <img
                                                                           className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                           src={notification.account.picture}
                                                                           alt="avatar"/>
                                                                       <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                           className="font-bold" >{notification.account.userName}</span> sent you a friend request {<TimeAgo date={notification.createdDate}/>}</p>

                                                                   </div>
                                                                   <div className="flex space-x-3 mt-1">
                                                                       <button
                                                                           onClick={()=>respondToFriendRequest(notification.addingId, true)}
                                                                           type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                                                           Accept
                                                                       </button>
                                                                       <button
                                                                           onClick={()=>respondToFriendRequest(notification.addingId, false)}
                                                                           type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                                                           Reject
                                                                       </button>
                                                                   </div>
                                                               </div>
                                                           );
                                                       }
                                                       else{

                                                           return (
                                                               <div
                                                                   key={`notification-${notification.id}`}
                                                                   className="flex flex-col items-center px-4 py-3 -mx-2 border-b border-gray-100 dark:border-gray-700">
                                                                   <img
                                                                       className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                       src={notification.account.picture}
                                                                       alt="avatar"/>
                                                                   <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                       className="font-bold" >{notification.account.userName}</span> accepted your friend request {<TimeAgo date={notification.createdDate}/>}</p>
                                                                   
                                                               </div>
                                                           );
                                                           
                                                           
                                                       }
                                                    }
                                                    else if(notification.type === 'NewPostNotification'){

                                                        return(
                                                            <div
                                                                onClick={()=>navigate("/post/"+notification.postId)}
                                                                key={`notification-${notification.id}`}
                                                                className="cursor-pointer flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                                <img
                                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                    src={notification.account.picture}
                                                                    alt="avatar"/>
                                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                    className="font-bold" >{notification.account.userName}</span> {notification.created?"created":"shared"} a new Post {<TimeAgo date={notification.createdDate}/>}</p>
                                                            </div>
                                                        );
                                                    }
                                                    else if(notification.type === 'NewCommentNotification'){
                                                        return(
                                                            <div
                                                                onClick={()=>navigate("/post/"+notification.postId)}
                                                                key={`notification-${notification.id}`}
                                                                className="cursor-pointer flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                                <img
                                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                    src={notification.account.picture}
                                                                    alt="avatar"/>
                                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                    className="font-bold" >{notification.account.userName}</span> commented on your post {<TimeAgo date={notification.createdDate}/>}</p>
                                                            </div>
                                                        );
                                                    }
                                                    else if (notification.type === 'NewLikeNotification'){
                                                        return(
                                                            <div
                                                                onClick={()=>navigate("/post/"+notification.postId)}
                                                                key={`notification-${notification.id}`}
                                                                className="cursor-pointer flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                                <img
                                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                    src={notification.account.picture}
                                                                    alt="avatar"/>
                                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                    className="font-bold" >{notification.account.userName}</span> liked your post {<TimeAgo date={notification.createdDate}/>}</p>
                                                            </div>
                                                        );
                                                    }
                                                    else{
                                                        return(
                                                            <div
                                                                key={`notification-${notification.id}`}
                                                                className="flex items-center px-4 py-3 -mx-2 border-b border-gray-100 dark:border-gray-700">
                                                                <img
                                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                                    src={notification.account.picture}
                                                                    alt="avatar"/>
                                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                                    className="font-bold" >{notification.account.userName}</span> sent you a message {<TimeAgo date={notification.createdDate}/>}</p>
                                                            </div>

                                                        );
                                                    }



                                                })
                                            }

                                        </div>

                                    </div>
                                </div>


                                <div className="hs-dropdown relative inline-block [--placement:bottom]">
                                    <button id="hs-dropdown-slideup-animation" type="button"
                                            className="hs-dropdown-toggle relative z-10 block p-2 text-gray-700 border border-transparent rounded-md dark:text-white focus:border-blue-500 focus:ring-opacity-40 dark:focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-400 focus:ring bg-gray-900 focus:outline-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                        </svg>
                                    </button>

                                    <div
                                        className="absolute hs-dropdown-menu hs-dropdown-open:opacity-100 w-72 transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden z-20 transition-[margin,opacity] opacity-0 duration-300 mt-2 min-w-[15rem] bg-white shadow-md rounded-lg p-2 dark:bg-gray-800 dark:border dark:border-gray-700 dark:divide-gray-700"
                                        aria-labelledby="hs-dropdown-slideup-animation">
                                        <Link to={"/profile/"+account?.id}
                                              className="block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            view profile
                                        </Link>

                                        <Link to="/settings"
                                              className="block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            Settings
                                        </Link>
                                        <hr className="border-gray-200 dark:border-gray-700 "/>
                                        <div  onClick={()=>signOut()}
                                              className="cursor-pointer block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            Sign Out
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                        </>
                    }


                </div>
            </div>
        </nav>
        // </div>




    );


}


export default Navbar;