import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Tooltip} from "flowbite-react";
import ContentEditable from "react-contenteditable";
import parse from "html-react-parser";


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

function Message({accountId, setUnReadMessages, setMessagesArr, messageProp, stompClient, containerClient}){
    const [message, setMessage] = useState(messageProp);
    const messageRef = useRef(null);
    const isInViewPort = useIsInViewport(messageRef);

    const deleteMessage = ()=>{
        stompClient?.send("/chat/delete",
            {},
            JSON.stringify({...message})
        );
        setMessagesArr(prevState=>[...prevState.map(msg=>msg.id===message.id?{
            ...msg,
            content:"",
            deleted:true
        }:msg)]);
        setMessage({
            ...message,
            content:"",
            deleted:true
        });
    };
    const injectImages = async ()=>{



        const imagesNameArr = [];




        parse(messageProp.content,{
            replace(domNode){
                if (domNode.name === "img") {
                    imagesNameArr.push(domNode.attribs.src);
                    return domNode;
                }
            }
        });

        let newContent = messageProp.content;

        for(let elem of imagesNameArr){

            const elemBlobClient = containerClient.getBlobClient(elem);
            const elemBlob = await elemBlobClient.download();
            const elemBlobBody = await elemBlob.blobBody;
            const elemURL = URL.createObjectURL(elemBlobBody);

            newContent = newContent.replace(elem, elemURL);
        }

        setMessage({
            ...messageProp,
            content:newContent,

        });


    };
    useEffect(()=>{
        injectImages();
    },[]);

    useEffect(()=>{
        if(isInViewPort && !message.viewed && message.id){
            setMessage({
                ...message,
                viewed:true
            });
            stompClient?.send('/chat/view/'+message.id);
            setUnReadMessages(prevState=>[...prevState.filter(msg=>msg.id !== message.id)]);
        }
    },[isInViewPort]);


    const pic = (

        <svg onClick={()=>deleteMessage()} xmlns="http://www.w3.org/2000/svg" style={{color:"#9ca3af"}} viewBox="0 0 24 24" className={"cursor-pointer w-5 h-5 bg-gray-800"}>
            <path fill="currentColor" d="M18.36 19.78L12 13.41l-6.36 6.37l-1.42-1.42L10.59 12L4.22 5.64l1.42-1.42L12 10.59l6.36-6.36l1.41 1.41L13.41 12l6.36 6.36z"/>
        </svg>
    );




    if(accountId === message.senderId){

        if(message.deleted){

            return (
                <div className="self-end bg-black rounded-full px-3 py-1 mt-2 border-2 border-white" ref={messageRef}>
                    <p className="text-xl text-white">*Deleted message*</p>
                </div>
            );
        }

        else{
            return(
                <div className={"self-end mt-2"}>
                    <Tooltip content={pic} arrow={false} placement={'left'} trigger={"hover"} className={"p-0 m-0"}>
                        <div className="bg-gray-600 rounded-full px-3 py-1" ref={messageRef}>
                            <ContentEditable
                                className={"text-xl text-white"}
                                html={message.content}
                                onChange={()=>{}}
                                disabled={true}
                            />
                        </div>
                    </Tooltip>
                </div>

            );

        }


    }

    else {

        if(message.deleted){

            return (
                <div className="self-start bg-black rounded-full px-3 py-1 mt-2 border-2 border-white" ref={messageRef}>
                    <p className="text-xl text-white">*Deleted message*</p>
                </div>
            );

        }

        else{
            return(
                <div className="self-start mt-2 bg-slate-900 rounded-full px-3 py-1" ref={messageRef}>
                    <ContentEditable
                        className={"text-xl text-white"}
                        html={message.content}
                        onChange={()=>{}}
                        disabled={true}
                    />
                </div>

            );
        }


    }

}




export default Message;






