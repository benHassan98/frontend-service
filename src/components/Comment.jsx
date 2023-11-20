import {useContext, useEffect, useState} from 'react';
import ContentEditable from "react-contenteditable";
import { EditorContent, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import sanitizeHtml from "sanitize-html";
import parse from "html-react-parser";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {useNavigate} from "react-router-dom";
import TimeAgo from "react-timeago";
function Comment({propComment, fetchAccount, setCommentsArr, containerClient}){

    const [comment, setComment] = useState({});

    const {accessToken, setAccessToken} = useContext(AccessTokenContext);
    const [,,removeCookie] = useCookies();
    const navigate = useNavigate();



    const injectImages = async ()=>{

        const account = await fetchAccount(propComment.accountId);

        const imagesNameArr = [];
        const urlToSrc = {};



        parse(propComment.content,{
            replace(domNode){
                if (domNode.name === "img") {
                    imagesNameArr.push(domNode.attribs.src);
                    return domNode;
                }
            }
        });

        let newContent = propComment.content;

        for(let elem of imagesNameArr){

            const elemBlobClient = containerClient.getBlobClient(elem);
            const elemBlob = await elemBlobClient.download();
            const elemBlobBody = await elemBlob.blobBody;
            const elemURL = URL.createObjectURL(elemBlobBody);

            urlToSrc[elemURL] = elem;

            newContent = newContent.replace(elem, elemURL);
        }

        setComment({
            ...propComment,
            account,
            newContent,
            urlToSrc,
        });


    };
    const deleteCommentRequest = (e)=>{

        if(e){e.preventDefault();}

        fetch(import.meta.env.VITE_POST_SERVICE+"/"+comment.id,{
            method:"DELETE",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(res=>{
                if(res.status === 200){

                    setCommentsArr(prevState=>[...prevState.filter(postComment=>postComment.id!==comment.id)])

                }

                else if(res.status === 401){

                    fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                        method:"GET",
                        headers:{
                            "Content-Type": "application/json",
                        },
                        credentials:"include"
                    })
                        .then(async (res)=>{
                            if(res.status === 200){
                                const data = await res.json();
                                setAccessToken(data.access_token);
                                deleteCommentRequest();
                            }
                            else{
                                removeCookie("refresh_token");
                                removeCookie("JSESSIONID");
                                setAccessToken(null);
                                navigate("/login");
                            }

                        })
                        .catch(err=>console.error(err));
                }
                else{
                    throw new Error(res.statusText);
                }


            })
            .catch(err=>console.error(err));

    };

    useEffect(()=>{

        injectImages();

    },[]);




return(

    <div className="rounded-lg bg-gray-700 py-4 px-4 mb-2">

        <div className="flex justify-between">

            <div className="flex items-center">
                <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                     src={comment.account?.picture}
                     alt="avatar"/>
                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link">{comment.account?.userName}</a>
                    <span
                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2"><TimeAgo date={comment.createdDate}  /></span>

            </div>

            <div className="flex items-center">


                <div
                    onClick={()=>deleteCommentRequest()}
                    className="hover:bg-black rounded-full transition-colors duration-300 transform w-8 h-8 flex items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"
                         style={{color:"#9ca3af"}}>
                        <path fill="currentColor"
                              d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2ZM7 6v13Z"/>
                    </svg>

                </div>



            </div>


        </div>
        <ContentEditable
            className={"mt-2 text-gray-300"}
            html={comment.content}
            onChange={()=>{}}
            disabled={true}
        />



    </div>




);

}




export default Comment;