import {useContext, useEffect, useState} from 'react';
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {EditorContent, useEditor} from "@tiptap/react";
import sanitizeHtml from "sanitize-html";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import parse from "html-react-parser";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {useNavigate, Link} from "react-router-dom";
import {v4 as uuidv4} from "uuid";
import Message from "./Message.jsx";
import {uploadImage} from './FireBaseConfig.js';

function Messenger({account}){

    const [newMessage, setNewMessage] = useState(null);
    const [friendsArr, setFriendsArr] = useState([]);
    const [chatIsOpen, setChatIsOpen] = useState(false);
    const [chatFriend, setChatFriend] = useState(null);
    const [friendsTabIsOpen, setFriendsTabIsOpen] = useState(false);
    const [newMessageContent, setNewMessageContent] = useState("");
    const [newMessageImageList, setNewMessageImageList] = useState([]);
    const [messagesArr, setMessagesArr] = useState([]);
    const [unReadMessages, setUnReadMessages] = useState([]);

    const [stompClient, setStompClient] = useState(null);


    const [,,removeCookie] = useCookies();
    const {accessToken, setAccessToken, setAccessTokenIsNull, logout, setLogout} = useContext(AccessTokenContext);
    const navigate = useNavigate();


    const extensions = [
        StarterKit,
        Image.configure({

            HTMLAttributes: {
                class: "w-32 h-32",

            }
        }),

    ];
    
    const defaultSanitizeOptions = {
        allowedTags: ['img', 'div', 'p'],
        allowedAttributes: {
            'img': ['src', 'alt', 'class'],
            'div': ['class', 'id'],
            'p': ['class', 'id']
        },
        allowedSchemesByTag: {'img': ['blob', 'http', 'https']},
    };

    const newMessageEditor = useEditor({
        extensions,
        editorProps: {
            attributes: {
                class: "block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
        },
        onUpdate: ({editor}) => {
            console.log(editor.getHTML());
            setNewMessageContent(sanitizeHtml(editor.getHTML(), defaultSanitizeOptions));
        },

    });

    const setupStomp = ()=>{
        console.log("account?   ",account);
        let socket = new SockJS(import.meta.env.VITE_CHAT_SERVICE+"/websocket");
        let stompClient = Stomp.over(socket);

        stompClient.connect({},function (frame) {
            console.log('Connected: ' + frame);

            stompClient.subscribe(`/queue/chat.${account?.id}`,(req)=> {
                    const reqBody = JSON.parse(req.body);

                    console.log("newMessage:  ",reqBody);
                    setNewMessage({
                        ...reqBody
                    });

                }
                ,{
                    'auto-delete':true,
                    'durable':true
                }
            );

            stompClient.subscribe(`/exchange/availableFriends/${account?.id}`,(req)=>{
                const reqBody = JSON.parse(req.body);
                console.log("reqBody:  ",reqBody);
                setFriendsArr( prevState =>[...prevState.map(friend=>({...friend,available:reqBody.includes(friend.id)}))]);

            });


            stompClient.subscribe(`/exchange/availableFriends/availableFriend.${account?.id}`,(req)=>{
                const reqBody = JSON.parse(req.body);
                setFriendsArr(prevState => [...prevState.map(friend=>friend.id === reqBody?{
                    ...friend,
                    available:true
                }:friend)]);

            });

            stompClient.subscribe(`/exchange/availableFriends/unAvailableFriend.${account?.id}`,(req)=>{
                const reqBody = JSON.parse(req.body);
                setFriendsArr(prevState => [...prevState.map(friend=>friend.id === reqBody?{
                    ...friend,
                    available:false
                }:friend)]);

            });

            setTimeout(()=>{
                stompClient.send(
                    "/app/chat/availableFriends",
                    {},
                    JSON.stringify({
                        accountId:account?.id,
                        friendList:account?.friendList.map(friend=>friend.id)
                    })
                );

                stompClient.send(
                    "/app/chat/availableFriend",
                    {},
                    JSON.stringify({
                        accountId:account?.id,
                        friendList:account?.friendList.map(friend=>friend.id)
                    })
                );

            },3000);

        });





        setStompClient(stompClient);


    };

    const isImageExists = (url, content) => {
        let exists = false;

        parse(content, {
            replace(domNode) {
                if (domNode.name === 'img') {
                    exists |= (domNode.attribs.src.includes(url));
                }

                return domNode;
            }
        });


        return exists;
    };
    const newMessageRequest = async (e)=>{
        e.preventDefault();

        let content = sanitizeHtml(newMessageContent, defaultSanitizeOptions);
        const imageList = newMessageImageList.filter(image => isImageExists(image.url, content));

        const newMessage = {
            senderId:account?.id,
            receiverId:chatFriend?.id,
            content,
            
        };


        imageList.forEach(image => {
            content = content.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });

        const idList = imageList.map(image=>image.id);
        const fileList = imageList.map(image=>image.file);

        for(let i = 0;i<idList.length;i++){

            const newImageId = idList[i];
            const newImage = fileList[i];

            await uploadImage(newImage, newImageId);

        }





        stompClient.send(
            "/app/chat/send",
            {},
            JSON.stringify({
                ...newMessage,
                content
            }));

        newMessageEditor.commands.clearContent();
        setNewMessageContent("");
        setNewMessageImageList([]);



    };

    const fetchMessages = (accountId, accessTokenParam)=>{

        fetch(import.meta.env.VITE_CHAT_SERVICE + "/messages/" + accountId+'/'+account?.id, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
            },
            credentials: "include"
        })
            .then(async (res) => {
                if (res.status === 200) {
                    const data = await res.json();

                    console.log("Messages: ", data);

                    setMessagesArr([...data]);

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
                                fetchMessages(accountId, data.access_token);
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

    const fetchUnReadMessages = async (accessTokenParam)=>{

        try{
           const res = await fetch(import.meta.env.VITE_CHAT_SERVICE + "/message/unRead/"+account?.id, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials: "include"
            });
            if (res.status === 200) {
                const data = await res.json();


                console.log("unReadMessages: ", data);

                setUnReadMessages([...data]);

            } else if (res.status === 401) {
                const tokenRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include"
                });
                if (tokenRes.status === 200) {
                    const data = await tokenRes.json();
                    setAccessToken(data.access_token);
                    await fetchUnReadMessages(data.access_token);
                } else {
                    setLogout(true);
                }
            } else {
                console.error(res.statusText);
            }

        }
        catch(e){
            console.error(e);
        }
    };


    useEffect(()=>{
        if(account?.friendList){
            setFriendsArr([...account.friendList]);
            ( async ()=>{
                setupStomp();
                await fetchUnReadMessages();
            })();
        }


    },[account]);

    useEffect(()=>{
        if(logout){

            stompClient.send(
                "/app/chat/unAvailableFriend",
                {},
                JSON.stringify({
                    accountId:account?.id,
                    friendList:account?.friendList.map(friend=>friend.id)
                })
            );
            stompClient.disconnect();
            
        }
    },[logout]);

    useEffect(()=>{
        if(newMessage){

            if(chatIsOpen){
                if(newMessage.deleted){
                    setMessagesArr(prevState => [...prevState.map(message=>message.id === newMessage.id?{
                        ...newMessage
                    }:message)]);
                }
                else{
                    setMessagesArr(prevState => [...prevState, newMessage]);
                }

            }
            else{
                if(newMessage.deleted){
                    setMessagesArr(prevState => [...prevState.map(message=>message.id === newMessage.id?{
                        ...newMessage
                    }:message)]);
                }
                else{
                    setUnReadMessages(prevState => [...prevState, newMessage]);
                }

            }

            setNewMessage(null);
        }

    },[newMessage]);

if(!account){
    return (<></>);
}

return(
    <div className="hs-dropdown inline-flex [--placement:top] [--auto-close:false] fixed left-20 bottom-0 z-50">
        <button id="hs-dropup" type="button" onClick={()=>setFriendsTabIsOpen(prevState => !prevState)}
                className="hs-dropdown-toggle py-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 w-48">
            Messages
            {Boolean(unReadMessages.length) &&
                <span className="flex absolute top-0 end-0 -mt-2 -me-2">
    <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 dark:bg-blue-600"></span>
    <span className="relative inline-flex text-xs bg-blue-500 text-white rounded-full py-0.5 px-1.5">
      {unReadMessages.length}
    </span>
  </span>
            }
            <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fillRule="evenodd"
                clipRule="evenodd"
                className="h-5 w-5"
            >
                <path
                    d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
            </svg>
        </button>

        <div
            className="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden z-10 bg-white rounded-lg dark:bg-gray-800 h-[30rem]"
            aria-labelledby="hs-dropup">

            <div
                className={"flex flex-col rounded-lg border-solid border-2 border-slate-500 w-[22rem] h-full overflow-y-auto"}>

                {
                    friendsTabIsOpen &&
                    friendsArr.map(friend=>{
                        const friendUnReadMessages = unReadMessages.filter(message=>message.senderId === friend.id);
                        return(
                            <div key={`chat-${friend.id}`} className="rounded-t-lg flex items-center justify-center py-2 mt-2">
                                <div className="flex items-center justify-end">
                                    <div className="w-10 h-10 overflow-hidden rounded-full">
                                        <img
                                            src={friend.picture}
                                            className="object-cover w-full h-full" alt="avatar"/>
                                    </div>
                                    <h3
                                        onClick={()=>{
                                            setFriendsTabIsOpen(false);
                                            setChatIsOpen(true);
                                            setChatFriend({
                                                ...friend
                                            });
                                            fetchMessages(friend.id);
                                            setUnReadMessages(prevState=> [...prevState.filter(message=>message.id!== friend.id)]);
                                        }}
                                        className="font-bold cursor-pointer c truncate w-36 block px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {friend.userName}</h3>

                                </div>

                                {
                                    friend.available &&
                                    <span
                                        className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Available
            </span>
                                }
                                {
                                    Boolean(friendUnReadMessages.length) &&
                                    <span className="inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                    {friendUnReadMessages.length}
                                </span>
                                }
                            </div>
                        );
                    })
                }



                {
                    chatIsOpen &&
                    <div className="rounded-t-lg flex items-center justify-center py-2 sticky top-0 bg-gray-600">

                        <div className="flex items-center justify-end">
                            <button
                                onClick={()=>{
                                    setChatIsOpen(false);
                                    setChatFriend(null);
                                    setFriendsTabIsOpen(true);
                                    setMessagesArr([]);
                                }}
                                className="mx-2 inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" width="12" height="12" viewBox="0 0 12 12">
                                    <path fill="currentColor" d="M10.5 6a.75.75 0 0 0-.75-.75H3.81l1.97-1.97a.75.75 0 0 0-1.06-1.06L1.47 5.47a.75.75 0 0 0 0 1.06l3.25 3.25a.75.75 0 0 0 1.06-1.06L3.81 6.75h5.94A.75.75 0 0 0 10.5 6Z"/>
                                </svg>
                            </button>
                            <div className="w-10 h-10 overflow-hidden rounded-full">
                                <img
                                    src={chatFriend.picture}
                                    className="object-cover w-full h-full" alt="avatar"/>
                            </div>
                            <div className="font-bold cursor-pointer c truncate w-36 block px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={()=>navigate("/profile/"+chatFriend.id)}>
                                {chatFriend.userName}</div>

                        </div>

                        {
                            chatFriend.available &&
                            <span
                                className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Available
            </span>
                        }
                    </div>
                }

                <div className="flex-1 flex flex-col px-2 py-2 bg-gray-800">
                {
                    messagesArr.map(message=>{
                        return (
                            <Message key={`message-${message.id}`} messageProp={message} setUnReadMessages={setUnReadMessages} setMessagesArr={setMessagesArr} accountId={account?.id} stompClient={stompClient}/>
                        );
                    })
                }
                </div>


                {
                    chatIsOpen &&
                    <div className="sticky bottom-0">


                        <form>

                            <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">

                                <EditorContent className={"w-full mr-6"} editor={newMessageEditor}></EditorContent>

                                <button
                                    onClick={(e)=>newMessageRequest(e)}
                                    type="submit"
                                    className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                    <svg aria-hidden="true" className="w-6 h-6 rotate-90" fill="currentColor"
                                         viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                    </svg>
                                    <span className="sr-only">Send message</span>
                                </button>

                                <label
                                    htmlFor={`newMessageImageInput`}
                                    className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                              d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                    </svg>

                                </label>
                                <input id={`newMessageImageInput`} className={"hidden"} type="file" accept="image/*"
                                       onChange={async (e) => {
                                           const newImage = e.target.files[0];
                                           const newImageUrl = URL.createObjectURL(newImage);
                                           const newImageId = uuidv4();

                                           newMessageEditor.commands
                                               .setContent(
                                                   newMessageEditor.getHTML() + `<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`
                                               );

                                           setNewMessageContent(prevState => prevState + `<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);

                                           setNewMessageImageList((prevState) => [...prevState, {
                                               id: newImageId,
                                               url: newImageUrl,
                                               file: newImage
                                           }]);

                                       }

                                       }
                                />










                            </div>
                        </form>


                    </div>
                }


            </div>


        </div>
    </div>

);


}







export default Messenger;
