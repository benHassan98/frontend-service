import {useEffect, useRef, useState} from "react";
import sanitizeHtml from "sanitize-html"
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import dumb from "./../../public/dumb.jpg";
import qs from 'qs';
import {useCookies} from "react-cookie";
import {useNavigate, useResolvedPath, useSearchParams} from "react-router-dom";
import parse from 'html-react-parser';
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

    const [content, setContent] = useState("");
    const [filesList, setFilesList] = useState([]);
    const contentEditableRef = useRef();
    const testRef = useRef();
    const inputRef = useRef();
    const [stompClient, setStompClient] = useState(null);
    const [, setCookie] = useCookies();
    const [searchParams ,] = useSearchParams();
    const navigate = useNavigate();


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
                    const defaultOptions = {
                        allowedTags: [ 'img', 'div', 'p' ],
                        allowedAttributes: {
                            'a': [ 'href' ],
                            'img': [  'alt', 'is-new', 'nSrc' ],
                            'div': ['class', 'id'],
                            'p': ['class', 'id']
                        },
                    };
                    const newFile = e.target.files[0];
                    const newFileURL = URL.createObjectURL(newFile);
                    contentEditableRef.current.innerHTML+=`<img src=${newFileURL} nSrc=1/dumb alt=${newFile.name} />`+`<p class="text-5xl" id="p5">Hello</p>`;
                    console.log(contentEditableRef.current);
                    console.log("InnerHTML: ",contentEditableRef.current.innerHTML);
                    console.log("Sanitize: ",sanitizeHtml(contentEditableRef.current.innerHTML,defaultOptions));

                    setFilesList(prevState => [...prevState,newFile]);
                }}
            />

            <button className={"mr-8"} onClick={()=>{
                setCookie("refresh_token","LgLbhAKvdlzsS_ggEtK39b2_IEHFd0WXNXix1tmDLR5Dz9_inDOraFSc_ax2gegtd7D0Jx5oAQwDv1Mk6pc5hj_iClH7v5fDZJ9gb0FvlZnPvRPXAxQhq9lW424OFYkT");
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

    console.log(testRef.current);
    const arr = [];
    testRef.current.childNodes.forEach(node=>{
        node.lastChild;
        arr.push({
            username:node.lastChild.textContent,
            selected:node.lastChild.classList.contains("selected")
        });
    });
    console.log(arr);
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

                // stompClient.send("/like",
                //     {},
                //
                //     JSON.stringify({
                //         accountId:20,
                //         postId:10,
                //         isLike:1
                //     })
                // );

                fetch("http://localhost:8888/refresh",{
                    method:'GET',
                    credentials:'include'
                })
                    .then(res=>res.json())
                    .then(res=>{
                        console.log(res);
                    });



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


            <div className="p-6 space-y-6" ref={testRef}>
                <div className="flex items-center mb-2">
                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                         src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                         alt="avatar"/>
                        <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200 transition-colors duration-300 transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md  px-3 py-2"
                           tabIndex="0" role="link">
                            Khatab wedaa

                        </a>
                </div>
                <div className="flex items-center mb-2">
                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                         src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                         alt="avatar"/>
                        <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200 transition-colors duration-300 transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md  px-3 py-2 selected"
                           tabIndex="0" role="link">
                            Khatab wedaa

                        </a>
                </div>
                <div className="flex items-center mb-2">
                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                         src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                         alt="avatar"/>
                        <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200 transition-colors duration-300 transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md  px-3 py-2"
                           tabIndex="0" role="link">
                            Khatab wedaa

                        </a>
                </div>


            </div>

            <button>



                newInput
            </button>



        </>

    )



}



export default Test;