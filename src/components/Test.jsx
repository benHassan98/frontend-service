import {useEffect, useRef, useState} from "react";
import sanitizeHtml from "sanitize-html"
// import SockJS from "sockjs-client";
// import {Stomp} from "@stomp/stompjs";
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
function Test(){
    const extensions = [
        StarterKit,
        Image.configure({
            HTMLAttributes:{
                class:"w-32 h-32",
                "is-new":true
            }
        }),

    ];

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
        </div>;

    console.log("type:  ",type,params.get('token'));

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
                onChange={(e)=>{

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


    const testElement =  parse("<div> <p>Hello</p> <img alt='shit' src='dumb.jpg'/>  <p>World</p>   </div>",{
        replace(domNode){
            if(domNode.name === 'img'){
                domNode.attribs['is-new'] = true;
                return domNode;
            }
        }
    });
    const defaultOptions = {
        allowedTags: [ 'img', 'div' ],
        allowedAttributes: {
            'a': [ 'href' ],
            'img': [  'alt', 'src', 'is-new' ],
            'div': ['class', 'id'],
        },
    };
    console.log(testElement);
    console.log(ReactDOMServer.renderToStaticMarkup(testElement));
    console.log(sanitizeHtml(ReactDOMServer.renderToStaticMarkup(testElement),defaultOptions));
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

}}>
    test
</button>
            <button
            onClick={()=>{
                const x = parse("<p>Helyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy</p><br/> <p>BOMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM</p>");
                setTestState(x);

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

                // let socket = new SockJS("http://localhost:8081/websocket");
                // let stompClient = Stomp.over(socket);


                // console.log(stompClient);
                // stompClient.connect({},(frame)=>frame);
                // stompClient.connect({}, function (frame) {
                //
                //     console.log('Connected: ' + frame);
                //
                //     stompClient.subscribe('/topic/accountSearch',
                //         function (greeting) {
                //             console.log(JSON.parse(greeting.body).content);
                //         });
                //
                // });

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
                        <svg className="h-5 w-5 text-gray-600 mt-1 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
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

            <div id="notification-toast"
                 className="hs-removing:translate-x-5 hs-removing:opacity-0 transition duration-300 fixed bottom-5 right-5 w-[18rem] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700"
                 role="alert">
                <div className="flex p-4">
                    <div className="flex-shrink-0">
                        <img className="inline-block h-10 w-10 rounded-full"
                             src={"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80"}
                             alt="Image Description"/>
                        <button
                            data-hs-remove-element='#notification-toast' type="button"
                            className="absolute top-3 end-3 inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-lg text-gray-800 opacity-50 hover:opacity-100 focus:outline-none focus:opacity-100 dark:text-white">
                            <span className="sr-only">Close</span>
                            <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div className="ms-4 me-5">
                        <h3 className="text-gray-800 font-medium text-sm dark:text-white">
                            <span className="font-semibold">James</span>sent u a friend request
                        </h3>
                        <div className="flex space-x-3 mt-1">
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





        </>

    )



}



export default Test;