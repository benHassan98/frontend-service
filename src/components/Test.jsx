import {useEffect, useRef, useState} from "react";
import sanitizeHtml from "sanitize-html"
// import SockJS from "sockjs-client";
// import {Stomp} from "@stomp/stompjs";
// import qs from 'qs';
import {useCookies} from "react-cookie";
import {useNavigate, useResolvedPath, useSearchParams} from "react-router-dom";
import parse from 'html-react-parser';
// import axios from "axios";
import ReactDOMServer from 'react-dom/server';
import TimeAgo from 'react-timeago';
// import ContentEditable from "react-contenteditable";
// import { Editor } from "react-draft-wysiwyg";
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
            <TimeAgo date={Date.now()} minPeriod={60}/>






        </>

    )



}



export default Test;