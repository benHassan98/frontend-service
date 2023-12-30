import {useContext, useEffect, useState} from 'react';
import ContentEditable from "react-contenteditable";
import parse from "html-react-parser";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {Link} from "react-router-dom";
import TimeAgo from "react-timeago";
import {downloadImage} from "./FireBaseConfig.js";


function Comment({propComment, fetchAccount, setCommentsArr, showDelete}){

    const [comment, setComment] = useState({});

    const {accessToken, setAccessToken, setLogout} = useContext(AccessTokenContext);


    const injectImages = async ()=>{

        const account = await fetchAccount(propComment.accountId);

        const imagesIdArr = [];
        const urlToSrc = {};



        parse(propComment.content,{
            replace(domNode){
                if (domNode.name === "img") {
                    imagesIdArr.push(domNode.attribs.src);
                    return domNode;
                }
            }
        });

        let newContent = propComment.content;

        for(let elemId of imagesIdArr){

            const elemURL = await downloadImage(elemId);

            urlToSrc[elemURL] = elemId;

            newContent = newContent.replace(elemId, elemURL);

        }

        setComment({
            ...propComment,
            account,
            content:newContent,
            urlToSrc,
        });


    };
    const deleteCommentRequest = (e, accessTokenParam)=>{

        e.preventDefault();

        fetch(import.meta.env.VITE_POST_SERVICE+"/comment/"+comment.id,{
            method:"DELETE",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
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
                                deleteCommentRequest(e, data.access_token);
                            }
                            else{
                                setLogout(true);
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
                    <Link className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link" to={"profile/"+comment.account?.id}>{comment.account?.userName}</Link>
                    <span
                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">commented {Boolean(comment.createdDate) && <TimeAgo date={Date.parse(comment.createdDate)}  />}</span>

            </div>

            {
                showDelete &&
                <div className="flex items-center">


                    <div
                        onClick={(e)=>deleteCommentRequest(e)}
                        className="hover:bg-black rounded-full transition-colors duration-300 transform w-8 h-8 flex items-center justify-center cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"
                             style={{color:"#9ca3af"}}>
                            <path fill="currentColor"
                                  d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2ZM7 6v13Z"/>
                        </svg>

                    </div>



                </div>
            }


        </div>
        {
            Boolean(comment.content) &&
            <ContentEditable
                className={"mt-2 text-gray-300"}
                html={comment.content}
                onChange={()=>{}}
                disabled={true}
            />
        }



    </div>




);

}




export default Comment;