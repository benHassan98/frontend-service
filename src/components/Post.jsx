import {useState, useEffect, useContext, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {BlobServiceClient} from "@azure/storage-blob";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import TimeAgo from 'react-timeago';
import parse from 'html-react-parser';
import sanitizeHtml from "sanitize-html";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import ContentEditable from "react-contenteditable";
import { EditorContent, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Comment from "./Comment.jsx";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

function Post({postProp, id, account, withCommentAccordion = true, fetchAccount, setPostsArr, setSuccessToast, setDangerToast}){

    const [post, setPost] = useState({});
    const [postAccount, setPostAccount] = useState({});
    const [isVisibleToFollowers, setIsVisibleToFollowers] = useState(false);
    const [isLike, setIsLike] = useState(false);
    const [postContent, setPostContent] = useState("");
    const [editPostContent, setEditPostContent] = useState("");
    const [postArr, setPostArr] = useState([]);
    const [likesArr, setLikesArr] = useState([]);
    const [commentsArr, setCommentsArr] = useState([]);
    const [updatePostImageList, setUpdatePostImageList] = useState([]);
    const [publicSharedPostImageList, setPublicSharedPostImageList] = useState([]);
    const [privateSharedPostImageList, setPrivateSharedPostImageList] = useState([]);
    const [newCommentImageList, setNewCommentImageList] = useState([]);
    const [commentContent, setCommentContent] = useState("");
    const [privateSharedContent, setPrivateSharedContent] = useState("");
    const [publicSharedContent, setPublicSharedContent] = useState("");

    const friendsRef = useRef();

    const extensions = [
        StarterKit,
        Image.configure({

            HTMLAttributes:{
                class:"w-32 h-32",

            }
        }),

    ];


    const {accessToken, setAccessToken} = useContext(AccessTokenContext);
    const [,,removeCookie] = useCookies();
    const navigate = useNavigate();

    const [stompClient, setStompClient] = useState(null);


    const blobServiceClient = new BlobServiceClient(import.meta.env.VITE_BLOB_SAS);
    const containerClient = blobServiceClient.getContainerClient(import.meta.env.VITE_CONTAINER_NAME);
    const defaultSanitizeOptions = {
        allowedTags: [ 'img', 'div', 'p' ],
        allowedAttributes: {
            'img': [  'src', 'alt', 'class' ],
            'div': ['class', 'id'],
            'p':   ['class', 'id']
        },
        allowedSchemesByTag: {'img':['blob','http','https']},
    };

    const commentEditor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4 h-32 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
            console.log(editor.getHTML());
            setCommentContent(sanitizeHtml(editor.getHTML(),defaultSanitizeOptions));
        },

    });
    const publicSharedPostEditor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4 h-32 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
            console.log(editor.getHTML());
            setPublicSharedContent(sanitizeHtml(editor.getHTML(),defaultSanitizeOptions));
        },

    });

    const privateSharedPostEditor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4 h-32 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
            console.log(editor.getHTML());
            setPrivateSharedContent(sanitizeHtml(editor.getHTML(),defaultSanitizeOptions));
        },

    });
    const editPostEditor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4 h-32 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
            console.log(editor.getHTML());
            setEditPostContent(sanitizeHtml(editor.getHTML(),defaultSanitizeOptions));

        },

    });

    const isImageExists = (url, content)=>{
        let exists = false;

        parse(content,{
            replace(domNode){
                if(domNode.name === 'img'){
                    exists |= (domNode.attribs.src.includes(url));
                }

                return domNode;
            }
        });


        return exists;
    };

    const deletePostRequest = (e)=>{

        if(e){e.preventDefault();}

        fetch(import.meta.env.VITE_POST_SERVICE+"/"+post.id,{
            method:"DELETE",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(res=>{
                if(res.status === 200){
                    if(setPostsArr){
                        setPostsArr((prevState)=>[...prevState.filter(elem=>elem.id!==post.id)]);
                    }
                    else{
                        navigate("/");
                    }
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
                                deletePostRequest();
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
    const updatePostRequest = (e)=>{

        if(e){e.preventDefault();}

        let html = sanitizeHtml(editPostContent, defaultSanitizeOptions);
        const urlToSrc = postArr[0].currPost.urlToSrc;

        for(let [k,v] of Object.entries(urlToSrc)){
            html = html.replace(k,v);
        }
        // console.log(updatePostImageList);
        const imageList = updatePostImageList.filter(image=>isImageExists(image.url,html));
        imageList.forEach(image=>{
            html = html.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });



        const updatedPost = {
            ...post,
            sharedFromPostJson:JSON.stringify(post.sharedFromPost),
            content:html,
            edited:true,
            imageList
        };
        const formData = new FormData();

        Object.entries(updatedPost).forEach(([k,v])=>{

            if(k === 'imageList'){
                    v.forEach(image=>{
                        formData.append("idList",image.id);
                        formData.append("fileList",image.file);
                    });

                }
                else{
                    formData.append(k,v);
                }



        });


        // console.log("html: ",html);
        // console.log("formData: ",formData);
        axios({
            method: 'PUT',
            url: import.meta.env.VITE_POST_SERVICE+"/update",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer  ${accessToken}`
            },
            withCredentials:true
        }).then( async (res)=>{
                if(res.status === 200){
                    const data =  res.data;
                    setPostStates(data);
                    setSuccessToast("Post Edited Successfully");
                    setUpdatePostImageList([]);

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
                                updatePostRequest();
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
                    setDangerToast("An Error ocurred");
                    throw new Error(res.statusText);
                }

            })
            .catch(err=>console.error(err));


    };
    const sharePostRequest = (isPublic, e)=>{

        if(e) {e.preventDefault();}

        const friendsArr = [];
        let selectedCnt = 0;

        friendsRef.current.childNodes.forEach(node=>{

            const isSelected = node.classList.contains("bg-gray-600");
            const username = node.lastChild.textContent;

            selectedCnt += isSelected;

            friendsArr.push({
                id:account?.friendList.find(friend=>friend.userName === username).id,
                username,
                isSelected
            });
        });

        const friendsVisibilityType = isPublic? false : (selectedCnt<friendsArr.length);
        const visibleToFollowers = isPublic?true: isVisibleToFollowers;

        const visibleToFriendList = friendsArr.filter(friend=>friend.isSelected===friendsVisibilityType).map(friend=>friend.id);
        let content = isPublic?
            sanitizeHtml(publicSharedContent,defaultSanitizeOptions):
            sanitizeHtml(privateSharedContent,defaultSanitizeOptions);

        let imageList = isPublic?publicSharedPostImageList:privateSharedPostImageList;

        imageList = imageList.filter(image=>isImageExists(image.url,content));

        imageList.forEach(image=>{
          content = content.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });


        const formData = new FormData();

        const sharedPost = {
            accountId:account?.id,
            content,
            imageList,
            sharedFromPostJson:JSON.stringify(post),
            visibleToFollowers:JSON.stringify(visibleToFollowers),
            friendsVisibilityType:JSON.stringify(friendsVisibilityType),
            visibleToFriendList,
            edited:false
        };


        Object.entries(sharedPost).forEach(([k,v])=>{
            if(k === 'imageList'){
                    v.forEach(image=>{
                        formData.append("idList",image.id);
                        formData.append("fileList",image.file);
                    });

                }
                else{
                    formData.append(k,v);
                }



        });



        console.log("formData: ",formData);
        axios({
            method: 'POST',
            url: import.meta.env.VITE_POST_SERVICE+"/create",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer  ${accessToken}`
            },
            withCredentials:true
        }).then( async (res)=>{
                if(res.status === 200){
                    setSuccessToast("Post Shared just Now");
                    setPublicSharedPostImageList([]);
                    setPrivateSharedPostImageList([]);
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
                                sharePostRequest(isPublic);
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
                else {
                    setDangerToast("An Error ocurred");
                    throw new Error(res.statusText);
                }

            })
            .catch(err=>console.error(err));

    };

    const commentContentToHtml = async (content)=>{

        const imagesNameArr = [];
        parse(content,{
            replace(domNode){
                if (domNode.name === "img") {
                    imagesNameArr.push(domNode.attribs.src);
                    return domNode;
                }
            }
        });

        let newContent = content;

        for(let elem of imagesNameArr){

            const elemBlobClient = containerClient.getBlobClient(elem);
            const elemBlob = await elemBlobClient.download();
            const elemBlobBody = await elemBlob.blobBody;
            const elemURL = URL.createObjectURL(elemBlobBody);


            newContent = newContent.replace(elem, elemURL);
        }

        return newContent;
    };

    const newCommentRequest = (e)=>{

        if(e){e.preventDefault();}

        let content = sanitizeHtml(commentContent,defaultSanitizeOptions);

        const imageList = newCommentImageList.filter(image=>isImageExists(image.url,content));

        imageList.forEach(image=>{
            content = content.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });


        const formData = new FormData();
        const comment = {
            accountId:account?.id,
            content,
            postJson:JSON.stringify(post),
            imageList
        };
        Object.entries(comment).forEach(([k,v])=>{
            if(k === 'imageList'){
                v.forEach(image=>{
                    formData.append("idList",image.id);
                    formData.append("fileList",image.file);
                });

            }
            else{
                formData.append(k,v);
            }



        });

        console.log("form:  ",formData);

        axios({
            method: 'POST',
            url: import.meta.env.VITE_POST_SERVICE+"/comment/create",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer  ${accessToken}`
            },
            withCredentials:true
        })
            .then( async (res)=>{

                if(res.status === 200){
                    const data = res.data;
                    const newContent = await commentContentToHtml(data.content);

                    setCommentsArr(prevState => [...prevState, {
                        ...data,
                        content:newContent
                    }]);

                    setNewCommentImageList([]);
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
                                newCommentRequest();
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
                else {
                    setDangerToast("An Error Ocurred");
                    throw new Error(res.statusText);
                }




            })
            .catch(err=>console.error(err));


    };
    const likeRequest = ()=>{


        stompClient.send("/like",{},
            JSON.stringify({
            accountId:account?.id,
            postId:post.id,
            isLike:!isLike
        }));

        setIsLike(prevState => !prevState);

    };
    const extractPostContent = async (post)=>{
        const postContentArr = [];
        let currPost = post;
         while(currPost){
             const isShared = Boolean(currPost.sharedFromPost);
             const isEdited = Boolean(currPost.edited);
             const isDeleted = Boolean(currPost.deleted);
             const postAccount = await fetchAccount(currPost.accountId);

              const imagesNameArr = [];
              const urlToSrc = {};

              parse(currPost.content,{
                 replace(domNode){
                     if (domNode.name === "img") {
                         imagesNameArr.push(domNode.attribs.src);
                         return domNode;
                     }
                 }
             });

             let newContent = currPost.content;

             for(let elem of imagesNameArr){

                 const elemBlobClient = containerClient.getBlobClient(elem);
                 const elemBlob = await elemBlobClient.download();
                 const elemBlobBody = await elemBlob.blobBody;
                 const elemURL = URL.createObjectURL(elemBlobBody);

                 urlToSrc[elemURL] = elem;

                 newContent = newContent.replace(elem, elemURL);
             }

             if(!postContentArr.length){
                 currPost.urlToSrc = urlToSrc;
             }

             currPost.content = newContent;



             postContentArr.push({
                 isEdited,
                 isShared,
                 isDeleted,
                 postAccount,
                 currPost,

             });


             currPost = currPost.sharedFromPost;

         }

        return postContentArr;
    };

    const setPostStates = async (data)=>{

        const tempPostsArr = await extractPostContent({...data});
        const tempLikesArr = [];

        const dataAccount = await fetchAccount(data.accountId);

        console.log("postArr: ",tempPostsArr);

        for(let i = 0; i<data.likesList.length;i++){
            const likeAccount = await fetchAccount(data.likesList[i]);

            if(likeAccount.id === account?.id){
                setIsLike(true);
            }

            tempLikesArr.push(likeAccount);
        }

        setPost({...data});
        setPostAccount({...dataAccount});
        setPostContent(tempPostsArr[0].currPost.content);
        setEditPostContent(tempPostsArr[0].currPost.content);
        setPostArr([...tempPostsArr]);
        setLikesArr([...tempLikesArr]);
        setCommentsArr([...data.commentsList]);
    };
    const fetchPost = ()=>{

        fetch(import.meta.env.VITE_POST_SERVICE+"/"+id,{
            method:"GET",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const data = await res.json();

                    console.log("data: ",data);

                   setPostStates(data);
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
                                fetchPost();
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


        if(!postProp)
            fetchPost();
        else{
            setPostStates(postProp);
        }

    },[]);

    useEffect(()=>{
        console.log("setStomp Account: ",account);
        if(!account){
            return;
        }
        let socket = new SockJS(import.meta.env.VITE_POST_SERVICE+"/post/websocket");
        let stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {

            console.log('Connected: ' + frame);

            stompClient.subscribe(`/topic/post.${id}.add`,
                 async (req) => {

                     const reqBody = JSON.parse(req.body);

                     console.log("NEW");
                     console.log(reqBody);
                     console.log(account);
                if(!reqBody.id){
                    const newLikeAccount = await fetchAccount(reqBody.accountId);
                    setLikesArr(prevState => [...prevState, newLikeAccount]);
                    console.log("Like");

                }
                else if(account?.id !== reqBody.accountId) {
                    const newContent = await commentContentToHtml(reqBody.content);
                    setCommentsArr(prevState => [...prevState, {
                        ...reqBody,
                        content:newContent
                    }]);
                    console.log("Comment");
                }



                });

            stompClient.subscribe(`/topic/post.${id}.remove`,
                async (req) => {
                    console.log("REMOVE");
                    const reqBody = JSON.parse(req.body);
                    if(account?.id === reqBody.accountId){
                        return;
                    }
                    console.log(reqBody);
                    if(!reqBody.id){

                        setLikesArr(prevState => [...prevState.filter(likeAccount=>likeAccount.id !== reqBody.accountId)]);

                        console.log("Like");

                    }
                    else if(account?.id !== reqBody.accountId){
                        setCommentsArr(prevState => [...prevState.filter(comment=>comment.id !== reqBody.id)])
                        console.log("Comment");
                    }



                });



        });

        setStompClient(stompClient);


    },[account]);






    return (
        <div className=" px-4 py-4 bg-white rounded-lg shadow-md dark:bg-gray-800 flex flex-col mt-4 hs-accordion">
            <div className="flex justify-between">

                <div className="flex items-center">
                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                         src={postAccount.picture}
                         alt="avatar"/>
                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link">{postAccount.userName}</a>
                    <span
                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                        {post.sharedFromPost?"shared":"posted"} {Boolean(post.createdDate) && <TimeAgo date={Date.parse(post.createdDate)}/>}
                    </span>
                    <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{post.edited && "Edited"}</span>

                </div>
                {
                    Boolean(account?.id === postAccount.id && !post.deleted) &&
                    <div className="flex items-center gap-2">
                        <div
                            onClick={()=>{
                                editPostEditor.commands.setContent(postArr[0].currPost.content);
                            }}
                            data-hs-overlay={"#editModal"}
                            className="hover:bg-black rounded-full transition-colors duration-300 transform w-8 h-8 flex items-center justify-center cursor-pointer">

                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"
                                 style={{color:"#9ca3af"}}>
                                <path fill="currentColor"
                                      d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15q.4 0 .775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.138.763t-.437.662L7.25 21H3ZM17.6 7.8L19 6.4L17.6 5l-1.4 1.4l1.4 1.4Z"/>
                            </svg>

                        </div>

                        <div
                            onClick={(e)=>deletePostRequest(e)}
                            className="hover:bg-black rounded-full transition-colors duration-300 transform w-8 h-8 flex items-center justify-center cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6"
                                 style={{color:"#9ca3af"}}>
                                <path fill="currentColor"
                                      d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2ZM7 6v13Z"/>
                            </svg>

                        </div>
                        <div id="editModal"
                             className="hs-overlay hidden w-full h-full fixed top-0 left-0 z-[60] overflow-x-hidden overflow-y-auto">
                            <div
                                className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
                                <div
                                    className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                                    <div
                                        className="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700">

                                        <button type="button"
                                                className="hs-dropdown-toggle inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-sm dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                                                data-hs-overlay="#editModal">
                                            <span className="sr-only">Close</span>
                                            <svg className="w-3.5 h-3.5" width="8" height="8" viewBox="0 0 8 8" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M0.258206 1.00652C0.351976 0.912791 0.479126 0.860131 0.611706 0.860131C0.744296 0.860131 0.871447 0.912791 0.965207 1.00652L3.61171 3.65302L6.25822 1.00652C6.30432 0.958771 6.35952 0.920671 6.42052 0.894471C6.48152 0.868271 6.54712 0.854471 6.61352 0.853901C6.67992 0.853321 6.74572 0.865971 6.80722 0.891111C6.86862 0.916251 6.92442 0.953381 6.97142 1.00032C7.01832 1.04727 7.05552 1.1031 7.08062 1.16454C7.10572 1.22599 7.11842 1.29183 7.11782 1.35822C7.11722 1.42461 7.10342 1.49022 7.07722 1.55122C7.05102 1.61222 7.01292 1.6674 6.96522 1.71352L4.31871 4.36002L6.96522 7.00648C7.05632 7.10078 7.10672 7.22708 7.10552 7.35818C7.10442 7.48928 7.05182 7.61468 6.95912 7.70738C6.86642 7.80018 6.74102 7.85268 6.60992 7.85388C6.47882 7.85498 6.35252 7.80458 6.25822 7.71348L3.61171 5.06702L0.965207 7.71348C0.870907 7.80458 0.744606 7.85498 0.613506 7.85388C0.482406 7.85268 0.357007 7.80018 0.264297 7.70738C0.171597 7.61468 0.119017 7.48928 0.117877 7.35818C0.116737 7.22708 0.167126 7.10078 0.258206 7.00648L2.90471 4.36002L0.258206 1.71352C0.164476 1.61976 0.111816 1.4926 0.111816 1.36002C0.111816 1.22744 0.164476 1.10028 0.258206 1.00652Z"
                                                    fill="currentColor"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto">
                                        <div className="p-6 space-y-6">

                                            <form
                                                className="p-1 mx-auto rounded-md bg-gray-800"
                                            >


                                                <EditorContent editor={editPostEditor}></EditorContent>

                                                <div className="flex justify-end mt-2 gap-1">
                                                    <label
                                                        htmlFor={"postEditImageInput"}
                                                        className="cursor-pointer px-4 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                                            <path fill="currentColor"
                                                                  d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                                        </svg>

                                                    </label>
                                                    <input  id={"postEditImageInput"} className={"hidden"} type="file" accept="image/*"
                                                            onChange={(e)=>{
                                                                const newImage = e.target.files[0];
                                                                const newImageUrl = URL.createObjectURL(newImage);
                                                                const newImageId = uuid4();

                                                                editPostEditor.commands
                                                                    .setContent(
                                                                        editPostEditor.getHTML()+`<img src=${newImageUrl} alt=${newImage.name} />`
                                                                    );

                                                                setEditPostContent((prevState)=>prevState+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);

                                                                setUpdatePostImageList((prevState)=>[...prevState, {
                                                                    id:newImageId,
                                                                    url:newImageUrl,
                                                                    file:newImage
                                                                }]);

                                                                console.log({
                                                                    id:newImageId,
                                                                    url:newImageUrl,
                                                                    file:newImage
                                                                });

                                                            }}
                                                    />

                                                    <button
                                                        onClick={(e)=>updatePostRequest(e)}
                                                        data-hs-overlay="#editModal"
                                                        className="hs-dropdown-toggle px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Edit
                                                    </button>
                                                </div>
                                            </form>


                                        </div>
                                    </div>

                                </div>


                            </div>
                        </div>


                    </div>
                }

            </div>
            <ContentEditable
                className={"mt-2 text-gray-300"}
                html={postContent}
                onChange={()=>{}}
                disabled={true}
            />

            {
                postArr.filter((val,i)=>i>0).map((currVal)=>{



                    return(
                        <>
                        <div  className="flex items-center justify-between my-4">
                            <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>

                            <p className="text-xs text-center text-gray-500 uppercase dark:text-gray-400">
                                Shared From
                            </p>

                            <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
                        </div>

                            <div className="flex justify-between">

                                <div className="flex items-center">
                                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                         src={currVal.postAccount.picture}
                                         alt="avatar"/>
                                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0"
                                       role="link">{currVal.postAccount.userName}</a>
                                    {
                                        !currVal.isDeleted &&
                                        <>
                                        <span
                                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                                    {currVal.isShared?"shared":"posted"} {Boolean(currVal.currPost.createdDate) && <TimeAgo date={Date.parse(currVal.currPost.createdDate)}/>}
                            </span>
                            <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{currVal.isEdited && "Edited"}</span>
                                        </>
                                    }

                                </div>

                            </div>
                            <ContentEditable
                                className={"mt-2 text-gray-300"}
                                html={currVal.currPost.content}
                                onChange={()=>{}}
                                disabled={true}
                            />
                        </>

                    );
                })
            }

            <hr className="border-gray-200 dark:border-gray-700 mt-4"/>


                <div className="flex mt-2 items-center justify-between mb-2 hs-accordion-group">


                    <p className={(Boolean(likesArr.length) &&"cursor-pointer")+" text-white"} data-hs-overlay={Boolean(likesArr.length) && "#hs-slide-down-animation-modal"}>
                        {likesArr.length>0?likesArr.length>1?`${likesArr.length} Likes`:`${likesArr.length} Like`:"No Likes"}
                    </p>

                    <div id="hs-slide-down-animation-modal"
                         className="hs-overlay hidden w-full h-full fixed top-0 left-0 z-[60] overflow-x-hidden overflow-y-auto">
                        <div
                            className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
                            <div
                                className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                                <div
                                    className="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700">
                                    <h3 className="font-bold text-gray-800 dark:text-white">
                                        Likes
                                    </h3>
                                    <button type="button"
                                            className="hs-dropdown-toggle inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-sm dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                                            data-hs-overlay="#hs-slide-down-animation-modal">
                                        <span className="sr-only">Close</span>
                                        <svg className="w-3.5 h-3.5" width="8" height="8" viewBox="0 0 8 8" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M0.258206 1.00652C0.351976 0.912791 0.479126 0.860131 0.611706 0.860131C0.744296 0.860131 0.871447 0.912791 0.965207 1.00652L3.61171 3.65302L6.25822 1.00652C6.30432 0.958771 6.35952 0.920671 6.42052 0.894471C6.48152 0.868271 6.54712 0.854471 6.61352 0.853901C6.67992 0.853321 6.74572 0.865971 6.80722 0.891111C6.86862 0.916251 6.92442 0.953381 6.97142 1.00032C7.01832 1.04727 7.05552 1.1031 7.08062 1.16454C7.10572 1.22599 7.11842 1.29183 7.11782 1.35822C7.11722 1.42461 7.10342 1.49022 7.07722 1.55122C7.05102 1.61222 7.01292 1.6674 6.96522 1.71352L4.31871 4.36002L6.96522 7.00648C7.05632 7.10078 7.10672 7.22708 7.10552 7.35818C7.10442 7.48928 7.05182 7.61468 6.95912 7.70738C6.86642 7.80018 6.74102 7.85268 6.60992 7.85388C6.47882 7.85498 6.35252 7.80458 6.25822 7.71348L3.61171 5.06702L0.965207 7.71348C0.870907 7.80458 0.744606 7.85498 0.613506 7.85388C0.482406 7.85268 0.357007 7.80018 0.264297 7.70738C0.171597 7.61468 0.119017 7.48928 0.117877 7.35818C0.116737 7.22708 0.167126 7.10078 0.258206 7.00648L2.90471 4.36002L0.258206 1.71352C0.164476 1.61976 0.111816 1.4926 0.111816 1.36002C0.111816 1.22744 0.164476 1.10028 0.258206 1.00652Z"
                                                fill="currentColor"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        {
                                            likesArr.map((likeAccount, i)=>{

                                                return(
                                                    <div key={i} className="flex items-center mb-2">
                                                        <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                             src={likeAccount.picture}
                                                             alt="avatar"/>
                                                        <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200 transition-colors duration-300 transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md  px-3 py-2"
                                                           tabIndex="0" role="link">
                                                            {likeAccount.userName}
                                                        </a>
                                                    </div>
                                                );

                                            })
                                        }

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>


                    <p className={(withCommentAccordion&&"hs-accordion-toggle cursor-pointer")+"  text-white"}>
                        {commentsArr.length>0?commentsArr.length>1?`${commentsArr.length} Comments`:`${commentsArr.length} Comment`:"No Comments"}
                    </p>


                </div>


                <div className="mb-2">


                    <div className="flex mt-2">
                        <button
                            onClick={()=>likeRequest()}
                            className="px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-1">
                            {isLike?"UnLike":"Like"}
                        </button>
                        <button data-popover-target="popover-click" data-popover-trigger="click"
                                className="px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-1"
                        >Share
                        </button>
                        <div data-popover={true} id="popover-click" role="tooltip"
                             className="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
                            <div
                                className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Share</h3>
                            </div>
                            <div className="px-3 py-2 flex flex-col gap-1">
                                <div
                                    className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
                                    data-hs-overlay="#shareModal1"
                                >
                                    <p>In your profile</p>
                                </div>

                                <div
                                    className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
                                    data-hs-overlay="#shareModal2"
                                >
                                    <p>With your friends</p>
                                </div>

                            </div>
                            <div data-popper-arrow={true}></div>
                        </div>


                        <div id="shareModal1"
                             className="hs-overlay hidden w-full h-full fixed top-0 left-0 z-[60] overflow-x-hidden overflow-y-auto">
                            <div
                                className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
                                <div
                                    className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                                    <div
                                        className="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700">

                                        <button type="button"
                                                className="hs-dropdown-toggle inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-sm dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                                                data-hs-overlay="#shareModal1">
                                            <span className="sr-only">Close</span>
                                            <svg className="w-3.5 h-3.5" width="8" height="8" viewBox="0 0 8 8"
                                                 fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M0.258206 1.00652C0.351976 0.912791 0.479126 0.860131 0.611706 0.860131C0.744296 0.860131 0.871447 0.912791 0.965207 1.00652L3.61171 3.65302L6.25822 1.00652C6.30432 0.958771 6.35952 0.920671 6.42052 0.894471C6.48152 0.868271 6.54712 0.854471 6.61352 0.853901C6.67992 0.853321 6.74572 0.865971 6.80722 0.891111C6.86862 0.916251 6.92442 0.953381 6.97142 1.00032C7.01832 1.04727 7.05552 1.1031 7.08062 1.16454C7.10572 1.22599 7.11842 1.29183 7.11782 1.35822C7.11722 1.42461 7.10342 1.49022 7.07722 1.55122C7.05102 1.61222 7.01292 1.6674 6.96522 1.71352L4.31871 4.36002L6.96522 7.00648C7.05632 7.10078 7.10672 7.22708 7.10552 7.35818C7.10442 7.48928 7.05182 7.61468 6.95912 7.70738C6.86642 7.80018 6.74102 7.85268 6.60992 7.85388C6.47882 7.85498 6.35252 7.80458 6.25822 7.71348L3.61171 5.06702L0.965207 7.71348C0.870907 7.80458 0.744606 7.85498 0.613506 7.85388C0.482406 7.85268 0.357007 7.80018 0.264297 7.70738C0.171597 7.61468 0.119017 7.48928 0.117877 7.35818C0.116737 7.22708 0.167126 7.10078 0.258206 7.00648L2.90471 4.36002L0.258206 1.71352C0.164476 1.61976 0.111816 1.4926 0.111816 1.36002C0.111816 1.22744 0.164476 1.10028 0.258206 1.00652Z"
                                                    fill="currentColor"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto">
                                        <div className="p-6 space-y-6">

                                            <form
                                                className="p-1 mx-auto rounded-md bg-gray-800"
                                            >
                                                <EditorContent editor={publicSharedPostEditor}></EditorContent>

                                                <div className="flex justify-end mt-2 gap-1">
                                                    <label
                                                        htmlFor={"publicShareInput"}
                                                        className="cursor-pointer px-4 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                                            <path fill="currentColor"
                                                                  d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                                        </svg>

                                                    </label>
                                                    <input  id={"publicShareInput"} className={"hidden"} type="file" accept="image/*"
                                                            onChange={(e)=>{
                                                                const newImage = e.target.files[0];
                                                                const newImageUrl = URL.createObjectURL(newImage);
                                                                const newImageId = uuid4();

                                                                publicSharedPostEditor.commands
                                                                    .setContent(
                                                                        publicSharedPostEditor.getHTML()+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`
                                                                    );

                                                                setPublicSharedContent((prevState)=>prevState+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);


                                                                setPublicSharedPostImageList((prevState)=>[...prevState, {
                                                                    id:newImageId,
                                                                    url:newImageUrl,
                                                                    file:newImage
                                                                }]);
                                                            }}
                                                    />
                                                    <button
                                                        onClick={(e)=>sharePostRequest(true, e)}
                                                        data-hs-overlay="#shareModal1"
                                                        className="hs-dropdown-toggle px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Share
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="flex justify-between">

                                                <div className="flex items-center">
                                                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                         src={postAccount.picture}
                                                         alt="avatar"/>
                                                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link">{postAccount.userName}</a>
                                                    <span
                                                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                                            {post.sharedFromPost?"shared":"posted"} {Boolean(post.createdDate) && <TimeAgo date={Date.parse(post.createdDate)}/>}
                    </span>
                                                    <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{post.edited && "Edited"}</span>

                                                </div>


                                            </div>
                                            <ContentEditable
                                                className={"mt-2 text-gray-300"}
                                                html={postContent}
                                                onChange={()=>{}}
                                                disabled={true}
                                            />

                                            {
                                                postArr.filter((val,i)=>i>0).map((currVal)=>{



                                                    return(
                                                        <>
                                                            <div  className="flex items-center justify-between my-4">
                                                                <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>

                                                                <p className="text-xs text-center text-gray-500 uppercase dark:text-gray-400">
                                                                    Shared From
                                                                </p>

                                                                <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
                                                            </div>

                                                            <div className="flex justify-between">

                                                                <div className="flex items-center">
                                                                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                                         src={currVal.postAccount.picture}
                                                                         alt="avatar"/>
                                                                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0"
                                                                       role="link">{currVal.postAccount.userName}</a>
                                                                    <span
                                                                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                        {currVal.isShared?"shared":"posted"} {Boolean(currVal.currPost.createdDate) && <TimeAgo date={Date.parse(currVal.currPost.createdDate)}/>}
                    </span>
                                                                    <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{currVal.isEdited && "Edited"}</span>

                                                                </div>

                                                            </div>
                                                            <ContentEditable
                                                                className={"mt-2 text-gray-300"}
                                                                html={currVal.currPost.content}
                                                                onChange={()=>{}}
                                                                disabled={true}
                                                            />
                                                        </>

                                                    );
                                                })
                                            }

                                        </div>
                                    </div>

                                </div>


                            </div>
                        </div>


                        <div id="shareModal2"
                             className="hs-overlay hidden w-full h-full fixed top-0 left-0 z-[60] overflow-x-hidden overflow-y-auto">
                            <div
                                className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
                                <div
                                    className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                                    <div
                                        className="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700">

                                        <button type="button"
                                                className="hs-dropdown-toggle inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-sm dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                                                data-hs-overlay="#shareModal2">
                                            <span className="sr-only">Close</span>
                                            <svg className="w-3.5 h-3.5" width="8" height="8" viewBox="0 0 8 8"
                                                 fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M0.258206 1.00652C0.351976 0.912791 0.479126 0.860131 0.611706 0.860131C0.744296 0.860131 0.871447 0.912791 0.965207 1.00652L3.61171 3.65302L6.25822 1.00652C6.30432 0.958771 6.35952 0.920671 6.42052 0.894471C6.48152 0.868271 6.54712 0.854471 6.61352 0.853901C6.67992 0.853321 6.74572 0.865971 6.80722 0.891111C6.86862 0.916251 6.92442 0.953381 6.97142 1.00032C7.01832 1.04727 7.05552 1.1031 7.08062 1.16454C7.10572 1.22599 7.11842 1.29183 7.11782 1.35822C7.11722 1.42461 7.10342 1.49022 7.07722 1.55122C7.05102 1.61222 7.01292 1.6674 6.96522 1.71352L4.31871 4.36002L6.96522 7.00648C7.05632 7.10078 7.10672 7.22708 7.10552 7.35818C7.10442 7.48928 7.05182 7.61468 6.95912 7.70738C6.86642 7.80018 6.74102 7.85268 6.60992 7.85388C6.47882 7.85498 6.35252 7.80458 6.25822 7.71348L3.61171 5.06702L0.965207 7.71348C0.870907 7.80458 0.744606 7.85498 0.613506 7.85388C0.482406 7.85268 0.357007 7.80018 0.264297 7.70738C0.171597 7.61468 0.119017 7.48928 0.117877 7.35818C0.116737 7.22708 0.167126 7.10078 0.258206 7.00648L2.90471 4.36002L0.258206 1.71352C0.164476 1.61976 0.111816 1.4926 0.111816 1.36002C0.111816 1.22744 0.164476 1.10028 0.258206 1.00652Z"
                                                    fill="currentColor"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-y-auto">

                                        <div className="p-6 space-y-6">

                                            <form
                                                className="p-1 mx-auto rounded-md bg-gray-800"
                                            >
                                                <EditorContent editor={privateSharedPostEditor}></EditorContent>

                                                <div className="flex justify-end mt-2 gap-1">
                                                    <label
                                                        htmlFor={"privateShareInput"}
                                                        className="px-4 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                                            <path fill="currentColor"
                                                                  d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                                        </svg>

                                                    </label>
                                                    <input  id={"privateShareInput"} className={"hidden"} type="file" accept="image/*"
                                                            onChange={(e)=>{
                                                                const newImage = e.target.files[0];
                                                                const newImageUrl = URL.createObjectURL(newImage);
                                                                const newImageId = uuid4();

                                                                privateSharedPostEditor.commands
                                                                    .setContent(
                                                                        privateSharedPostEditor.getHTML()+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`
                                                                    );

                                                                setPrivateSharedContent((prevState)=>prevState+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);

                                                                setPrivateSharedPostImageList((prevState)=>[...prevState, {
                                                                    id:newImageId,
                                                                    url:newImageUrl,
                                                                    file:newImage
                                                                }]);
                                                            }}
                                                    />
                                                    <button
                                                        onClick={e=>sharePostRequest(false,e)}
                                                        className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Share
                                                    </button>
                                                </div>


                                            </form>

                                            <div className="p-6 space-y-6 bg-gray-700 rounded-md overflow-y" ref={friendsRef}>


                                                {
                                                    account?.friendList?.map((friend, i)=>{
                                                        console.log("friend: ",friend);
                                                        return(
                                                            <div
                                                                key={i}
                                                                onClick={e=>{
                                                                    if(e.currentTarget.classList.contains("hover:bg-gray-600")){
                                                                        e.currentTarget.classList.replace(
                                                                            "hover:bg-gray-600",
                                                                            "bg-gray-600"
                                                                        );
                                                                    }
                                                                    else{
                                                                        e.currentTarget.classList.replace(
                                                                            "bg-gray-600",
                                                                            "hover:bg-gray-600"
                                                                        );
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 mb-2 rounded-md p-1 transition-colors duration-300 transform hover:bg-gray-600">

                                                                <img
                                                                    className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                                    src={friend.picture}
                                                                    alt="avatar"/>
                                                                <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200"
                                                                   tabIndex="0" role="link">{friend.userName}</a>


                                                            </div>

                                                        );



                                                    })


                                                }


                                            </div>
                                            <div
                                                onClick={()=>setIsVisibleToFollowers(prevState => !prevState)}
                                                className={(isVisibleToFollowers?"bg-gray-600":"hover:bg-gray-600")+" cursor-pointer flex items-center gap-2 mb-2 transition-colors duration-300 transform rounded-md p-2"}>
                                                <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200"
                                                   tabIndex="0" role="link">Followers</a>
                                            </div>


                                            <div className="flex justify-between">

                                                <div className="flex items-center">
                                                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                         src={postAccount.picture}
                                                         alt="avatar"/>
                                                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link">{postAccount.userName}</a>
                                                    <span
                                                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                                            {post.sharedFromPost?"shared":"posted"} {Boolean(post.createdDate) && <TimeAgo date={Date.parse(post.createdDate)}/>}
                    </span>
                                                    <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{post.edited && "Edited"}</span>

                                                </div>


                                            </div>
                                            <ContentEditable
                                                className={"mt-2 text-gray-300"}
                                                html={postContent}
                                                onChange={()=>{}}
                                                disabled={true}
                                            />

                                            {
                                                postArr.filter((val,i)=>i>0).map((currVal)=>{



                                                    return(
                                                        <>
                                                            <div  className="flex items-center justify-between my-4">
                                                                <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>

                                                                <p className="text-xs text-center text-gray-500 uppercase dark:text-gray-400">
                                                                    Shared From
                                                                </p>

                                                                <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
                                                            </div>

                                                            <div className="flex justify-between">

                                                                <div className="flex items-center">
                                                                    <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                                         src={currVal.postAccount.picture}
                                                                         alt="avatar"/>
                                                                    <a className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0"
                                                                       role="link">{currVal.postAccount.userName}</a>
                                                                    <span
                                                                        className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">
                        {currVal.isShared?"shared":"posted"} {Boolean(currVal.currPost.createdDate) && <TimeAgo date={Date.parse(currVal.currPost.createdDate)}/>}
                    </span>
                                                                    <span className="text-sm font-light text-gray-600 dark:text-gray-400 mx-2">{currVal.isEdited && "Edited"}</span>

                                                                </div>

                                                            </div>
                                                            <ContentEditable
                                                                className={"mt-2 text-gray-300"}
                                                                html={currVal.currPost.content}
                                                                onChange={()=>{}}
                                                                disabled={true}
                                                            />
                                                        </>

                                                    );
                                                })
                                            }


                                        </div>

                                    </div>

                                </div>


                            </div>
                        </div>


                        <button
                            className={"px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex-1 "+(withCommentAccordion&&"hs-accordion-toggle")}>Comment
                        </button>
                    </div>


                </div>


                <div className={"overflow-hidden transition-[height] duration-300"+(withCommentAccordion?"hidden hs-accordion-content":"")}>

                    {
                        commentsArr.map((comment, i)=>{
                            return (
                                <Comment key={i} propComment={comment} setCommentsArr={setCommentsArr} fetchAccount={fetchAccount} containerClient={containerClient} showDelete={Boolean(account?.id === post.accountId || account?.id === comment.accountId)} />
                                );
                        })
                    }

                    <form className="p-1 mx-auto rounded-md bg-gray-800">

                        <EditorContent editor={commentEditor}></EditorContent>

                        <div className="flex justify-end mt-2 gap-1">
                            <label
                                htmlFor={"commentImageInput"}
                                className="cursor-pointer px-4 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                          d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                </svg>

                            </label>
                            <input  id={"commentImageInput"} className={"hidden"} type="file" accept="image/*"
                            onChange={(e)=>{
                                const newImage = e.target.files[0];
                                const newImageUrl = URL.createObjectURL(newImage);
                                const newImageId = uuid4();


                                commentEditor.commands
                                    .setContent(
                                        commentEditor.getHTML()+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`
                                    );

                                setCommentContent(prevState => prevState+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);

                                setNewCommentImageList((prevState)=>[...prevState, {
                                    id:newImageId,
                                    url:newImageUrl,
                                    file:newImage
                                }]);

                            }

                            }
                            />
                            <button
                                onClick={(e)=>newCommentRequest(e)}
                                className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Comment
                            </button>
                        </div>
                    </form>


                </div>


        </div>
    );
}
export default Post;