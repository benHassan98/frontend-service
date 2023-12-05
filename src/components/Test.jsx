import React, {useEffect, useMemo, useRef, useState} from "react";
import sanitizeHtml from "sanitize-html"
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
// import qs from 'qs';
import {useCookies} from "react-cookie";
import {useNavigate, useParams, useResolvedPath, useSearchParams} from "react-router-dom";
import parse from 'html-react-parser';
// import axios from "axios";
import ReactDOMServer from 'react-dom/server';
import TimeAgo from 'react-timeago';
// import ContentEditable from "react-contenteditable";
// import { Editor } from "react-draft-wysiwyg";
import {Tooltip, Modal, Accordion} from 'flowbite-react';
import {EditorState} from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import AtomicBlockUtils from "draft-js/lib/AtomicBlockUtils.js";
import { EditorContent, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import ContentEditable from "react-contenteditable";
import axios from "axios";
// function Test(){
//     const testRef = useRef([]);
//     const testRefFun = ()=>{
//         console.log(testRef.current);
//
//
//     };
//
//
//     return(
//         <>
//             <p
//             ref={(elem)=>testRef.current.push(elem)}
//             >first</p>
//             <p
//             ref={(elem)=>testRef.current.push(elem)}
//             >second</p>
//             <p
//             ref={(elem)=>testRef.current.push(elem)}
//             >third</p>
//
//             <button
//             onClick={()=>testRefFun()}
//             >Click</button>
//     </>
//     );
// }
function Test({fetchAccount, setNotificationsArr, setNotificationToast}){
    const extensions = [
        StarterKit,
        Image.configure({
            HTMLAttributes:{
                class:"w-32 h-32",
                "is-new":true
            }
        }),

    ];

    const mRef = useRef();
    const msgRef = useRef([]);


    const editor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto  block  mt-2 w-[20rem] h-[20rem]  placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4  py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
          console.log(editor.getHTML());
          let str = "blob:http://localhost:5173/acc50e6d-a95b-4170-8e88-617c19266ad7";
          console.log(str.split("/").reverse()[0]+"-"+Date.now());
        },

    });

    const {type} = useParams();
    const [params,] = useSearchParams();
    const editorContent = '<p>Hello World!</p>'
    const [content, setContent] = useState("");
    const [filesList, setFilesList] = useState([]);
    const contentEditableRef = useRef();
    const testRef = useRef("asdsadasdasdasdasdasdadsad<br>asdasdawdasdashbbawdyawdbawd<br> asdasdasdadawdasdawd");
    const inputRef = useRef();
    const [stompClient, setStompClient] = useState(null);
    const [, setCookie] = useCookies();
    const [searchParams ,] = useSearchParams();
    const navigate = useNavigate();
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [testState, setTestState] = useState();
    const [showModal, setShowModal] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const handleChange = (e)=>{
        testRef.current = e.target.value;
    };
    function createFormData(object, form, namespace) {
        const formData = form || new FormData();
        for (let property in object) {
            if (!object.hasOwnProperty(property) ||      !object[property]) {
                continue;
            }
            const formKey = namespace ? `${namespace}[${property}]` : property;
            if (object[property] instanceof Date) {
                formData.append(formKey, object[property].toISOString());
            } else if (typeof object[property] === 'object' && !(object[property] instanceof File)) {
                createFormData(object[property], formData, formKey);
            } else {
                formData.append(formKey, object[property]);
            }
        }
        return formData;
    }
    const addImage = (url)=>{

        const entityKey = editorState // from STATE
            .getCurrentContent()
            .createEntity('IMAGE', 'MUTABLE', {
                src:url,
                height: '10rem',
                width: '10rem',

            }).getLastCreatedEntityKey();

        // NEW EDITOR STATE
        const newEditorState = AtomicBlockUtils.insertAtomicBlock(
            editorState,
            entityKey,
            ' '
        );

        // SETSTATE
        setEditorState(newEditorState);
    }
    const onContentChange = (evt) => {
        setContent(sanitizeHtml(evt.currentTarget.innerHTML));
    };

    // useEffect(()=>{
    //
    //     setSocket(new SockJS("http://localhost:8081/websocket"));
    //
    // },[]);

    // useEffect(()=>{
    //     let socket = new SockJS("http://localhost:8080/websocket");
    //     let stompClient = Stomp.over(socket);
    //     stompClient.connect({}, function (frame) {
    //
    //         console.log('Connected: ' + frame);
    //
    //         stompClient.subscribe('/topic/post.10.add',
    //             function (greeting) {
    //
    //             const res = JSON.parse(greeting.body);
    //
    //                 console.log("NEW");
    //
    //             if(!res.id){
    //                 console.log("Comment");
    //             }
    //             else{
    //                 console.log("Like");
    //             }
    //             console.log(res);
    //
    //
    //             });
    //
    //         stompClient.subscribe('/topic/post.10.remove',
    //             function (greeting) {
    //                 console.log("REMOVE");
    //                 const res = JSON.parse(greeting.body);
    //
    //                 if(!res.id){
    //                     console.log("Comment");
    //                 }
    //                 else{
    //                     console.log("Like");
    //                 }
    //                 console.log(res);
    //
    //
    //             });
    //
    //
    //
    //     });
    //
    //     setStompClient(stompClient);
    //
    //
    // },[]);

    // useEffect(()=>{
    //     let socket2 = new SockJS("http://localhost:8080/chat/websocket");
    //     let stompClient2 = Stomp.over(socket2);
    //     stompClient2.connect({}, function (frame) {
    //
    //         console.log('Connected: ' + frame);
    //
    //         stompClient2.subscribe('/queue/200',
    //             function (greeting) {
    //                 console.log("Hello from 2");
    //                 console.log(JSON.parse(greeting.body));
    //
    //
    //             },{
    //             "auto-delete":true
    //             });
    //
    //     });
    //
    //
    //
    // },[]);

    useEffect(()=>{
        console.log("mRef: ",mRef.current.childNodes[1].classList);
    },[]);
    function useIsInViewport(ref) {
        const [isIntersecting, setIsIntersecting] = useState(false);

        const observer = useMemo(
            () =>
                new IntersectionObserver(([entry]) =>
                    setIsIntersecting(entry.isIntersecting),
                ),
            [],
        );

        useEffect(() => {
            observer.observe(ref.current);

            return () => {
                observer.disconnect();
            };
        }, [ref, observer]);

        return isIntersecting;
    }
    function Message({content}){
        const messageRef = useRef(null);
        const isInViewPort = useIsInViewport(messageRef);

        useEffect(()=>{
            if(isInViewPort){
                console.log(content," in view port");
            }
        },[isInViewPort]);


        const pic = (
            <svg xmlns="http://www.w3.org/2000/svg" style={{color:"#9ca3af"}} viewBox="0 0 24 24" className={"cursor-pointer w-5 h-5 bg-gray-800"}>
            <path fill="currentColor" d="M18.36 19.78L12 13.41l-6.36 6.37l-1.42-1.42L10.59 12L4.22 5.64l1.42-1.42L12 10.59l6.36-6.36l1.41 1.41L13.41 12l6.36 6.36z"/>
        </svg>);






        return(
            <div className={"self-end mt-2"}>
        <Tooltip content={pic} arrow={false} placement={'left'} trigger={"hover"} className={"p-0 m-0"}>
            <div className="bg-gray-600 rounded-full px-3 py-1" ref={messageRef}>
                <p className="text-xl text-white">{content}</p>
            </div>
        </Tooltip>
            </div>

        );
    }
    const tooltipContent = <div role="tooltip"
                                className="absolute invisible z-10 inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">

        <div
            className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Post</h3>
        </div>

        <div className="px-3 py-2 flex flex-col gap-1">
            <div
                className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
            >
                <p>In your profile</p>
            </div>

            <div
                className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
                data-hs-overlay="#postModal"
            >
                <p>With your friends</p>
            </div>

        </div>
        <div data-popper-arrow={true}></div>
    </div>;

    const tooltipContent2 = <div className={"w-64 text-sm text-gray-400 bg-gray-800 border border-gray-600 rounded-lg shadow-sm"}>
        <div
            className="px-3 py-2 bg-gray-700 border-b border-gray-600 rounded-t-lg">
            <h3 className="font-semibold text-white">Post</h3>
        </div>
        <div className="px-3 py-2 flex flex-col gap-1">
        <div
            className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1 flex justify-between items-center"
        >
            <p>In your profile</p>
            <div
                className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
                role="status" aria-label="loading">
                <span className="sr-only">Loading...</span>
            </div>
        </div>

        <div
            className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
            data-hs-overlay="#postModal"
        >
            <p>With your friends</p>
        </div>

    </div>
        </div>;
    
    const isInViewPortArr = [];
    console.log("viewPort: ",isInViewPortArr);
    
    
    console.log("type:  ",type,params.get('token'));
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
    return (
        <>

        <div
            ref={contentEditableRef}
            contentEditable
            onChange={(e)=>{
                console.log("onChange : ",e.currentTarget.innerHTML);
            }}
            onClick={(e)=>{
                console.log("onClick : ",e.currentTarget.innerHTML);
            }}
            style={{height:"300px",width:"200px"}}
            // onChange={onContentChange}
            // onBlur={onContentChange}
            // html={content}
            />

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={ async (e)=>{

                    const newFile = e.target.files[0];
                    const newFileURL = URL.createObjectURL(newFile);

                    editor.chain().focus().setImage({
                        src:newFileURL,
                        alt:newFile.name,
                    }).run();

                    setFilesList(prevState => [...prevState,newFile]);
                    testRef.current = `<img src=${newFileURL} alt=${newFile.name} class="w-14 h-14" />`;

                }}
            />

            <button className={"mr-8"} onClick={()=>{
                // setCookie("refresh_token","LgLbhAKvdlzsS_ggEtK39b2_IEHFd0WXNXix1tmDLR5Dz9_inDOraFSc_ax2gegtd7D0Jx5oAQwDv1Mk6pc5hj_iClH7v5fDZJ9gb0FvlZnPvRPXAxQhq9lW424OFYkT");
                editor.commands.setContent("<p>HellWorld</p>");
            }}>
                Cookie
            </button>
<button className={"mr-8"} onClick={async ()=>{

   // const res =  parse("<img src='hello' />",{
   //      replace(domNode){
   //          if (domNode.name === "img") {
   //              return <img src={"World"} />;
   //          }
   //      }
   //  });
   //  console.log(res);


    // new File(filesList[0]., "", undefined);


    //





    // console.log(testRef.current);
    // const arr = [];
    // testRef.current.childNodes.forEach(node=>{
    //     node.lastChild;
    //     arr.push({
    //         username:node.lastChild.textContent,
    //         selected:node.lastChild.classList.contains("selected")
    //     });
    // });
    // console.log(arr);
    // const res =  await fetch("http://localhost:8888/err",{
    //     method:"GET"
    // });
    // console.log("res: ",res);


    // axios.post('http://localhost:8080/perform_login',{
    //     username:'user',
    //     password:'password'
    // })
    //     .then(res=>{
    //         console.log(res);
    //     });

    // await fetch('http://localhost:8888/code',{
    //     credentials:"same-origin"
    // });
    //  const res =  await fetch("http://localhost:8888/logout",{
    //      method:"POST",
    //      // body:JSON.stringify({
    //      //     email:"user",
    //      //     password:"password"
    //      // }),
    //      headers:{
    //          "Content-Type": "application/json",
    //      },
    //      credentials:"include"
    //  });
    // console.log("Test:",res);
    // const json = await res.json();
    // console.log("Test JSON: ",json);

    // const res = await fetch('http://localhost:8888/code',{
    //     method:"POST",
    //     body:JSON.stringify({
    //         email:"user",
    //         password:"password"
    //     }),
    //     headers:{
    //         "Content-Type": "application/json",
    //     },
    //     credentials:"include"
    //
    // });


    // navigate('/'+res.url);
    // const loginResponse = await axios.get('http://localhost:8888/code'
    //     ,{
    //     email:'user',
    //     password:'password'
    // }
    // );
    // console.log(loginResponse.data);
    // console.log(loginResponse.headers);
    // await axios.get("http://localhost:8081/oauth2/authorize?client_id=oidc-client&response_type=code&redirect_uri=http://localhost:5173/oauth2/code&scope=openid"
    //     , {withCredentials:true}
    // );


    // fetch('http://localhost:8080/try',{
    //     method: "GET",
    //     credentials:"include",
    //
    // })
    //     .then(res=>console.log(res));

    // axios.post(import.meta.env.VITE_API_URL+"/getUser",{
    //     access_token:accessToken
    // },
    //     {
    //         withCredentials:true
    //     })
    //     .then(res=>{
    //         console.log(res);
    //         console.log(res.data);
    //     })
    //     .catch(err=>console.error(err));




    stompClient.send("/addFriend",{},JSON.stringify({
        addingId:"2",
        addedId:"1",
        isRequest:true,
        isAccepted:false
    }));


}}>
    test
</button>
            <button
            onClick={()=>{
                const id = 2;
                let socket = new SockJS(import.meta.env.VITE_NOTIFICATIONS_SERVICE+"/notifications/websocket");
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


                // console.log(import.meta.env.VITE_ACCOUNT_SERVICE+"/10");
                   // fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/10",{
                   //  method:"GET",
                   //  headers:{
                   //      "Content-Type": "application/json",
                   //      "Authorization": `Bearer  `
                   //  },
                   //  credentials:"include"
                   //
                   // })
                   // .then(async(res)=>{
                   //
                   //  const data = await res.json();
                   //  console.log(data);
                   // });


                // stompClient.send("/like",
                //     {},
                //
                //     JSON.stringify({
                //         accountId:20,
                //         postId:10,
                //         isLike:1
                //     })
                // );

                // fetch("http://localhost:8888/refresh",{
                //     method:'GET',
                //     credentials:'include'
                // })
                //     .then(res=>res.json())
                //     .then(res=>{
                //         console.log(res);
                //     });
                //
                // const form = new FormData();
                
                // form.append('id','1');
                // form.append("file",filesList[0]);

                // form.append("imageList",filesList[0]);
                // form.append("imageList",filesList[0]);

                // form.append("idList","1");
                // form.append("idList","2");

                // axios({
                //     method: 'post',
                //     url: import.meta.env.VITE_POST_SERVICE+"/test/test",
                //     data: form,
                //     headers: {'Content-Type': 'multipart/form-data' }
                // })
                //     .then(res=>console.log(res.status));
                // form.append("testOb",{
                //    id:1,
                //    file:filesList[0]
                // });

                // fetch(import.meta.env.VITE_POST_SERVICE+"/test/test",{
                //     method:"POST",
                //     body:form,
                //     credentials:"include",
                //
                // })
                //     .then(res=>console.log(res.status));


                // const file  = filesList[0];
                //
                //
                // console.log(URL.createObjectURL(file));
                  // console.log(filesList);
                // const formData = new FormData();
                // filesList.forEach(file=>{
                //     formData.append("imagesList",file);
                // });
                // formData.append("id","1");
                // axios.post("http://localhost:8080/post/saveTest",formData,{
                //     headers: {
                //         "content-type": "multipart/form-data",
                //     },
                // })
                //     .then(res=>{
                //         console.log(res);
                //     });
                // fetch("http://localhost:8080/post/saveTest",{
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json",
                //     },
                //     body:JSON.stringify({
                //         // id:1,
                //         imagesList:filesList
                //     }),
                //     credentials:"include"
                // })
                //     .then(res=>{
                //         console.log(res.status);
                //     });
                // axios.post(import.meta.env.VITE_API_URL+'/login',{
                //     email:"hello",
                //     password:'world'
                // },{
                //     withCredentials:true
                // })
                //     .then(async(res)=>{
                //         const data = res.data;
                //         console.log("data: ",data);
                //         setAccessToken(data.access_token);
                //
                //     })
                //     .catch(err=>console.error(err));
            }}
            >Click</button>



                <EditorContent editor={editor} disabled={true}
                ></EditorContent>
            <div >
                {testState}
            </div>
            <button onClick={()=>{

            }}>Add Image</button>

            {/*<div ref={tiptapRef} className="element overflow-y-auto  block  mt-2 max-w-sm h-full  placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4  py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"></div>*/}
            {/*<ContentEditable*/}
            {/*    html={testRef.current}*/}
            {/*    disabled={true}*/}
            {/*    onChange={handleChange}*/}
            {/*    className="overflow-y-auto  block  mt-2  w-12 h-12  placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4  py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"/>*/}


            {/*<Editor editorStyle={{lineHeight: '75%'}} editorState={editorState} onEditorStateChange={setEditorState}  editorClassName={"overflow-y-auto  block  mt-2 max-w-sm h-full  placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4  py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"}  />*/}

            {/*<button onClick={()=>{*/}
            {/*    console.log(editorState.getCurrentContent().getAllEntities());*/}
            {/*}}>convert</button>*/}
            <Tooltip content={tooltipContent2} placement={"bottom"} trigger={"click"} className={"m-0 p-0"}>
                <button
                        className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Post
                </button>
            </Tooltip>




            <div className="max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700" role="alert">
                <div className="flex p-4">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-600 mt-1 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </div>
                    <div className="ms-4">
                        <h3 className="text-gray-800 font-semibold dark:text-white">
                            App notifications
                        </h3>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Notifications may include alerts, sounds and icon badges.
                        </div>
                        <div className="mt-4">
                            <div className="flex space-x-3">
                                <button type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                    Accept
                                </button>
                                <button type="button" className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-800 dark:text-blue-500 dark:focus:text-blue-400">
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div ref={mRef} className="hs-dropdown inline-flex [--placement:top] [--auto-close:false] fixed left-20 bottom-0">
                <button id="hs-dropup" type="button"
                        className="hs-dropdown-toggle py-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 w-48">
                    Messages
                    <span className="flex absolute top-0 end-0 -mt-2 -me-2">
    <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 dark:bg-blue-600"></span>
    <span className="relative inline-flex text-xs bg-blue-500 text-white rounded-full py-0.5 px-1.5">
      9+
    </span>
  </span>
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
                        className="flex flex-col rounded-lg   border-solid border-2 border-slate-500 w-80 h-full overflow-y-auto">



                        <div className="rounded-t-lg flex items-center justify-center py-2 mt-2">

                            <div className="flex items-center justify-end">
                                <div className="w-10 h-10 overflow-hidden rounded-full">
                                    <img
                                        src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                        className="object-cover w-full h-full" alt="avatar"/>
                                </div>
                                <h3 className="font-bold cursor-pointer c truncate w-36 block px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Khatab
                                    wedaa</h3>

                            </div>

                            <span
                                className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Available
            </span>
                            <span
                                className="inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium bg-blue-500 text-white">5</span>
                        </div>


                        {/*<div className="flex-1 flex flex-col-reverse px-2 py-2 bg-gray-800">*/}

                        {/*    <div className="self-end bg-gray-600 rounded-full px-3 py-1">*/}
                        {/*        <p className="text-xl text-white ">Hi</p>*/}
                        {/*    </div>*/}
                        {/*    <div className="self-start bg-slate-900 rounded-full px-3 py-1">*/}
                        {/*        <p className="text-xl text-white ">Hissss2</p>*/}
                        {/*    </div>*/}
                        {/*    <div className="self-end bg-gray-600 rounded-full px-3 py-1">*/}
                        {/*        <p className="text-xl text-white">How r u?</p>*/}
                        {/*    </div>*/}


                        {/*</div>*/}


                        {/*<div>*/}


                        {/*    <form>*/}
                        {/*        <label htmlFor="chat" className="sr-only">Your message</label>*/}
                        {/*        <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">*/}

                        {/*            <textarea id="chat" rows="1"*/}
                        {/*                      className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"*/}
                        {/*                      placeholder="Your message..." style={{resize:"none"}}></textarea>*/}
                        {/*            <button type="submit"*/}
                        {/*                    className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">*/}
                        {/*                <svg aria-hidden="true" className="w-6 h-6 rotate-90" fill="currentColor"*/}
                        {/*                     viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">*/}
                        {/*                    <path*/}
                        {/*                        d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>*/}
                        {/*                </svg>*/}
                        {/*                <span className="sr-only">Send message</span>*/}
                        {/*            </button>*/}

                        {/*            <button type="submit"*/}
                        {/*                    className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">*/}
                        {/*                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">*/}
                        {/*                    <path fill="currentColor"*/}
                        {/*                          d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>*/}
                        {/*                </svg>*/}
                        {/*                <span className="sr-only">Send image</span>*/}
                        {/*            </button>*/}
                        {/*        </div>*/}
                        {/*    </form>*/}


                        {/*</div>*/}


                    </div>


                </div>
            </div>




            <div ref={mRef} className="hs-dropdown inline-flex [--placement:top] [--auto-close:false] fixed right-20 bottom-0">
                <button id="hs-dropup" type="button"
                        className="hs-dropdown-toggle py-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800 w-48">
                    Messages
                    <span className="flex absolute top-0 end-0 -mt-2 -me-2">
    <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 dark:bg-blue-600"></span>
    <span className="relative inline-flex text-xs bg-blue-500 text-white rounded-full py-0.5 px-1.5">
      9+
    </span>
  </span>
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
                        className="flex flex-col rounded-lg bg-gray-600 border-solid border-2 border-slate-500 w-80 h-full overflow-y-auto">

                        <div className="rounded-t-lg flex items-center justify-center py-2 mt-2">

                            <div className="flex items-center justify-end">
                                <button className="mx-2 inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" width="12" height="12" viewBox="0 0 12 12">
                                        <path fill="currentColor" d="M10.5 6a.75.75 0 0 0-.75-.75H3.81l1.97-1.97a.75.75 0 0 0-1.06-1.06L1.47 5.47a.75.75 0 0 0 0 1.06l3.25 3.25a.75.75 0 0 0 1.06-1.06L3.81 6.75h5.94A.75.75 0 0 0 10.5 6Z"/>
                                    </svg>
                                </button>
                                <div className="w-10 h-10 overflow-hidden rounded-full">
                                    <img
                                        src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                        className="object-cover w-full h-full" alt="avatar"/>
                                </div>
                                <h3 className="font-bold cursor-pointer c truncate w-36 block px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Khatab
                                    wedaa</h3>

                            </div>

                            <span
                                className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Available
            </span>
                        </div>



                        <div className="flex-1 flex flex-col px-2 py-2 bg-gray-800">



                            <div className="self-end bg-gray-600 rounded-full px-3 py-1 flex gap-2">
                                <p className="text-xl text-white ">Hi</p>
                            </div>
                            <div className="self-start bg-slate-900 rounded-full px-3 py-1">
                                <p className="text-xl text-white ">Hissss2</p>
                            </div>
                            <div className="self-end bg-gray-600 rounded-full px-3 py-1">
                                <p className="text-xl text-white">How r u?</p>
                            </div>
                            <Message content={"Test1"}/>
                            <Message content={"Test2"}/>
                            <div className="self-end bg-black rounded-full px-3 py-1 mt-2 border-2 border-white">
                                <p className="text-xl text-white">*Deleted message*</p>
                            </div>
                            <div>
                                <svg className="w-6 h-6 text-gray-800 dark:text-white" viewBox="0 0 24 24"
                                     fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M12 22C10.8954 22 10 21.1046 10 20H14C14 21.1046 13.1046 22 12 22ZM20 19H4V17L6 16V10.5C6 7.038 7.421 4.793 10 4.18V2H13C12.3479 2.86394 11.9967 3.91762 12 5C12 5.25138 12.0187 5.50241 12.056 5.751H12C10.7799 5.67197 9.60301 6.21765 8.875 7.2C8.25255 8.18456 7.94714 9.33638 8 10.5V17H16V10.5C16 10.289 15.993 10.086 15.979 9.9C16.6405 10.0366 17.3226 10.039 17.985 9.907C17.996 10.118 18 10.319 18 10.507V16L20 17V19ZM17 8C16.3958 8.00073 15.8055 7.81839 15.307 7.477C14.1288 6.67158 13.6811 5.14761 14.2365 3.8329C14.7919 2.5182 16.1966 1.77678 17.5954 2.06004C18.9942 2.34329 19.9998 3.5728 20 5C20 6.65685 18.6569 8 17 8Z"
                                        fill="currentColor"></path>
                                </svg>
                            </div>

                        </div>


                        <div>


                            <form>
                                <label htmlFor="chat" className="sr-only">Your message</label>
                                <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">

                                    <textarea id="chat" rows="1"
                                              className="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                              placeholder="Your message..." style={{resize:"none"}}></textarea>
                                    <button type="submit"
                                            className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                        <svg aria-hidden="true" className="w-6 h-6 rotate-90" fill="currentColor"
                                             viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                        </svg>
                                        <span className="sr-only">Send message</span>
                                    </button>

                                    <button type="submit"
                                            className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                            <path fill="currentColor"
                                                  d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                        </svg>
                                        <span className="sr-only">Send image</span>
                                    </button>
                                </div>
                            </form>


                        </div>


                    </div>


                </div>
            </div>














            <button
                className="hs-dropdown-toggle relative z-10 block p-2 text-gray-700 border border-transparent rounded-md dark:text-white focus:border-blue-500 focus:ring-opacity-40 dark:focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-400 focus:ring bg-gray-900 focus:outline-none mr-2">

                                        <span
                                            className="absolute top-0 end-0 inline-flex items-center w-3.5 h-3.5 rounded-full border-2 border-white text-xs font-medium transform -translate-y-1/2 translate-x-1/2 bg-red-500 text-white dark:border-slate-900">

  </span>


                <svg className="flex-shrink-0 w-5 h-5" xmlns="http://www.w3.org/2000/svg"
                     width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
            </button>

        </>

    )



}



export default Test;