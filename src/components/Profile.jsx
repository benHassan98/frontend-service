import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {useContext, useState, useRef, useEffect} from "react";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {Link, useNavigate, useParams} from "react-router-dom";
import {BlobServiceClient} from "@azure/storage-blob";
import {EditorContent, useEditor} from "@tiptap/react";
import sanitizeHtml from "sanitize-html";
import { v4 as uuidv4 } from 'uuid';
import Post from "./Post.jsx";
import axios from "axios";
import parse from "html-react-parser";

function Profile({account, setAccount,  fetchAccount, notificationStompClient, setSuccessToast, setDangerToast}){

    const {id} = useParams();
    const [profileAccount, setProfileAccount] = useState(null);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostImageList, setNewPostImageList] = useState([]);
    const [postsArr, setPostsArr] = useState([]);
    const [isVisibleToFollowers, setIsVisibleToFollowers] = useState(false);


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

    const friendsRef = useRef();


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
    const newPostEditor = useEditor({
        extensions,
        editorProps:{
            attributes:{
                class:"overflow-y-auto block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-4 h-32 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
            }
        },
        onUpdate:({editor})=>{
            console.log(editor.getHTML());
            setNewPostContent(sanitizeHtml(editor.getHTML(),defaultSanitizeOptions));
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
    const newPostRequest = (isPublic, e)=>{
        if(e){e.preventDefault();}
        let content = sanitizeHtml(newPostContent,defaultSanitizeOptions);


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

        const imageList = newPostImageList.filter(image=>isImageExists(image.url,content));

        imageList.forEach(image=>{
            content = content.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });


        const formData = new FormData();
        const newPost = {
            accountId:profileAccount?.id,
            content,
            visibleToFollowers,
            friendsVisibilityType,
            visibleToFriendList,
            imageList
        };
        Object.entries(newPost).forEach(([k,v])=>{
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
            url: import.meta.env.VITE_POST_SERVICE+"/create",
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

                    if(data.visibleToFollowers&& !data.friendsVisibilityType){
                        setPostsArr(prevState => [data,...prevState]);
                    }

                    newPostEditor.commands.clearContent();
                    setNewPostContent("");
                    setNewPostImageList([]);

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
                                newPostRequest(isPublic);
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
    const friendRequest = ()=>{


        notificationStompClient.send(
            "/addFriend",
            {},
            JSON.stringify({
                addingId:account?.id,
                addedId:profileAccount?.id,
                isRequest:true
            }));


    };
    const unFriendRequest = ()=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/unFriend",{
            method:"POST",
            body:JSON.stringify({
                removingId:account?.id,
                removedId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const newFriendList = account?.friendList.filter(friend=>friend.id !== profileAccount?.id);

                    setAccount({
                        ...account,
                        friendList:newFriendList
                    });

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
                                unFriendRequest();
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
    const followRequest = ()=>{

        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/follow",{
            method:"POST",
            body:JSON.stringify({
                followerId:account?.id,
                followeeId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const newFollowerList = [...account?.followerList, profileAccount];

                    setAccount({
                        ...account,
                        followerList:newFollowerList
                    });

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
                                followRequest();
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
    const unFollowRequest = ()=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/unFollow",{
            method:"POST",
            body:JSON.stringify({
                followerId:account?.id,
                followeeId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const newFollowerList = account?.followerList.filter(follower=>follower.id !== profileAccount?.id);

                    setAccount({
                        ...account,
                        followerList:newFollowerList
                    });

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
                                unFollowRequest();
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
    const fetchProfilePosts = ()=>{

        fetch(import.meta.env.VITE_POST_SERVICE+"/profile/"+id,{
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

                    setPostsArr([...data.reverse()]);

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
                                fetchProfilePosts(id);
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
        fetchAccount(id)
            .then(res=>{
               setProfileAccount({
                   ...res
               });
            });


    },[]);

    useEffect(()=>{
        fetchProfilePosts();
    },[]);





    return(
        <div className="m-20 flex flex-col">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center p-2">

                    <img src={profileAccount?.picture} className="object-cover rounded-full w-20 h-20" alt="avatar"/>

                        <div className="flex flex-col ml-6">
                            <h2 className="text-white text-4xl">{profileAccount?.userName}</h2>
                            <h4 className="text-white text-xl">@{profileAccount?.email.split("@")[0]}</h4>

                        </div>



                </div>

                {
                    Boolean(account?.id !== profileAccount?.id) &&
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                        {
                            Boolean(account?.friendList.find(friend=>friend.id === profileAccount?.id))?
                                <>
                                <div
                                    className="text-gray-900 bg-white border border-gray-300 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 flex items-center justify-between gap-1">
                                    <p>Friend</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                              d="m9 19.414l-6.707-6.707l1.414-1.414L9 16.586L20.293 5.293l1.414 1.414z"/>
                                    </svg>

                                </div>

                                    <button
                                            onClick={()=>unFriendRequest()}
                                            type="button"
                                            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                         UnFriend
                                    </button>
                                </>
                                :
                                <button
                                    onClick={()=>friendRequest()}
                                    type="button"
                                    className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                    Add Friend
                                </button>


                        }
                        </div>
                        <div className="flex flex-col gap-1">
                        {
                            Boolean(account?.followerList.find(follower=>follower.id === profileAccount?.id))?
                                <>
                                    <div
                                        className="text-gray-900 bg-white border border-gray-300 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 flex items-center justify-between gap-1">
                                        <p>Following</p>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                            <path fill="currentColor"
                                                  d="m9 19.414l-6.707-6.707l1.414-1.414L9 16.586L20.293 5.293l1.414 1.414z"/>
                                        </svg>

                                    </div>

                                    <button
                                            onClick={()=>unFollowRequest()}
                                            type="button"
                                            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                        UnFollow
                                    </button>
                                </>
                                :
                                <button
                                    onClick={()=>followRequest()}
                                    type="button"
                                    className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                    Follow
                                </button>

                        }
                        </div>



                    </div>
                }





            </div>





            <div className="flex ">
                <div className="w-[20rem]">

                    <div className="overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 mt-5">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">About me</h2>

                        </div>
                        <div className="px-4 py-2">
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{profileAccount?.aboutMe}</p>
                        </div>
                        <hr className="border-gray-200 dark:border-gray-700 "/>

                            <div className="flex items-center px-4 py-2 justify-center ">
                                <h2 className="mt-1 text-sm text-gray-600 dark:text-gray-400">Member since {new Date(profileAccount?.createdDate).toDateString()}</h2>

                            </div>


                    </div>

                    <div className="overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 mt-5 flex flex-col">
                        <div className="flex items-center px-4 py-2 bg-gray-900">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Friends</h2>

                        </div>

                        <ul className="flex flex-col px-4 py-4 gap-2">

                            {
                                profileAccount?.friendList.map((friend, i)=>{
                                    return(
                                        <li key={i} className="flex justify-between">

                                            <div className="flex items-center">
                                                <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block" src={friend.picture} alt="avatar"/>
                                                <Link className="text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link" to={"/profile/"+friend.id}>{friend.userName}</Link>
                                            </div>


                                        </li>

                                    );

                                })


                            }


                        </ul>







                    </div>






                </div>



                <div className="flex flex-col flex-1 p-2">
                    {
                        Boolean(account?.id === profileAccount?.id) &&
                        <form className="p-2 rounded-md shadow-md bg-gray-800">

                            <EditorContent editor={newPostEditor}></EditorContent>

                            <div className="flex justify-end mt-2 gap-1">
                                <label
                                    htmlFor={"newPostImageInput"}
                                    className="cursor-pointer px-4 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                              d="M23 4v2h-3v3h-2V6h-3V4h3V1h2v3h3zm-8.5 7a1.5 1.5 0 1 0-.001-3.001A1.5 1.5 0 0 0 14.5 11zm3.5 3.234l-.513-.57a2 2 0 0 0-2.976 0l-.656.731L9 9l-3 3.333V6h7V4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v3.234z"/>
                                    </svg>

                                </label>
                                <input  id={"newPostImageInput"} className={"hidden"} type="file" accept="image/*"
                                        onChange={(e)=>{
                                            const newImage = e.target.files[0];
                                            const newImageUrl = URL.createObjectURL(newImage);
                                            const newImageId = uuid4();


                                            newPostEditor.commands
                                                .setContent(
                                                    newPostEditor.getHTML()+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`
                                                );

                                            setNewPostContent(prevState => prevState+`<img src=${newImageUrl} alt=${newImage.name} class="w-32 h-32" />`);

                                            setNewPostImageList((prevState)=>[...prevState, {
                                                id:newImageId,
                                                url:newImageUrl,
                                                file:newImage
                                            }]);

                                        }

                                        }
                                />
                                <button data-popover-target="popover-bottom" data-popover-placement="bottom"
                                        data-popover-trigger="click"
                                        className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Post
                                </button>

                                <div data-popover={true} id="popover-bottom" role="tooltip"
                                     className="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">

                                    <div
                                        className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Post</h3>
                                    </div>

                                    <div className="px-3 py-2 flex flex-col gap-1">
                                        <div
                                            onClick={e=>newPostRequest(true, e)}
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
                                </div>

                                <div id="postModal"
                                     className="hs-overlay hidden w-full h-full fixed top-0 left-0 z-[60] overflow-x-hidden overflow-y-auto">
                                    <div
                                        className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
                                        <div
                                            className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                                            <div
                                                className="flex justify-between items-center py-3 px-4 border-b dark:border-gray-700">

                                                <button type="button"
                                                        className="hs-dropdown-toggle inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-sm dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                                                        data-hs-overlay="#postModal">
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

                                                    <div className="p-6 space-y-6 bg-gray-700 rounded-md overflow-y" ref={friendsRef}>
                                                        {
                                                            profileAccount?.friendList.map((friend, i)=>{
                                                                return <div
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
                                                                    className="flex items-center gap-2 mb-2 transition-colors duration-300 transform hover:bg-gray-600 rounded-md p-1">

                                                                    <img
                                                                        className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block"
                                                                        src={friend.picture}
                                                                        alt="avatar"/>
                                                                    <p className="font-bold text-gray-700 cursor-pointer dark:text-gray-200"
                                                                          tabIndex="0" role="link" to={"/profile/"+friend.userName}>{friend.userName}</p>


                                                                </div>;

                                                            })
                                                        }

                                                    </div>
                                                    <div
                                                        onClick={()=>setIsVisibleToFollowers(prevState => !prevState)}
                                                        className={(isVisibleToFollowers?"bg-gray-600":"hover:bg-gray-600")+" cursor-pointer flex items-center gap-2 mb-2 transition-colors duration-300 transform rounded-md p-2"}>
                                                        <p className="font-bold text-gray-700 cursor-pointer dark:text-gray-200"
                                                           tabIndex="0" role="link">Followers</p>
                                                    </div>

                                                    <button
                                                        onClick={e=>newPostRequest(false, e)}
                                                        className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">Post
                                                    </button>

                                                </div>

                                            </div>

                                        </div>


                                    </div>
                                </div>
                            </div>
                        </form>

                    }
                    {
                        postsArr.map((post, i)=>{

                            return(
                                <Post key={i} postProp={post} id={post.id} withCommentAccordion={true} account={account} fetchAccount={fetchAccount} setPostsArr={setPostsArr} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast}   />
                            );
                        })
                    }


        </div>


</div>






</div>
    );
}

export default Profile;