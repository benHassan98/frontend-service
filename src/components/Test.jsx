import {useEffect, useRef, useState} from "react";
import sanitizeHtml from "sanitize-html"
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import dumb from "./../../public/dumb.jpg";
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
    const inputRef = useRef();
    const [stompClient, setStompClient] = useState(null);
    const onContentChange = (evt) => {
        setContent(sanitizeHtml(evt.currentTarget.innerHTML));
    };

    // useEffect(()=>{
    //
    //     setSocket(new SockJS("http://localhost:8081/websocket"));
    //
    // },[]);

    useEffect(()=>{
        let socket = new SockJS("http://localhost:8080/websocket");
        let stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {

            console.log('Connected: ' + frame);

            stompClient.subscribe('/topic/post.10.add',
                function (greeting) {

                const res = JSON.parse(greeting.body);

                    console.log("NEW");

                if(!res.id){
                    console.log("Comment");
                }
                else{
                    console.log("Like");
                }
                console.log(res);


                });

            stompClient.subscribe('/topic/post.10.remove',
                function (greeting) {
                    console.log("REMOVE");
                    const res = JSON.parse(greeting.body);

                    if(!res.id){
                        console.log("Comment");
                    }
                    else{
                        console.log("Like");
                    }
                    console.log(res);


                });



        });

        setStompClient(stompClient);


    },[]);

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
                console.log(e.currentTarget.innerHTML);
            }}
            onClick={(e)=>{
                console.log(e.currentTarget.innerHTML);
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
                    setFilesList(prevState => [...prevState,e.target.files[0]]);
                }}
            />

            <button
            onClick={()=>{

                stompClient.send("/like",
                    {},

                    JSON.stringify({
                        accountId:20,
                        postId:10,
                        isLike:1
                    })
                );



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




        </>

    )



}



export default Test;