import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {useContext, useState, useRef, useEffect} from "react";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {Link, useNavigate, useParams} from "react-router-dom";
import {EditorContent, useEditor} from "@tiptap/react";
import sanitizeHtml from "sanitize-html";
import { v4 as uuidv4 } from 'uuid';
import Post from "./Post.jsx";
import axios from "axios";
import parse from "html-react-parser";
import {Modal, Tooltip} from "flowbite-react";
import {uploadImage} from './FireBaseConfig.js';


function Profile({account, setAccount,  fetchAccount, notificationStompClient, setSuccessToast, setDangerToast}){

    const {id} = useParams();
    const [profileAccount, setProfileAccount] = useState(null);
    const [postsArr, setPostsArr] = useState([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostImageList, setNewPostImageList] = useState([]);
    const [isVisibleToFollowers, setIsVisibleToFollowers] = useState(false);
    const [newPostLoader, setNewPostLoader] = useState(false);
    const [friendRequestInProcess, setFriendRequestInProcess] = useState(false);

    const extensions = [
        StarterKit,
        Image.configure({

            HTMLAttributes:{
                class:"w-32 h-32",

            }
        }),

    ];


    const {accessToken, setAccessToken, setLogout} = useContext(AccessTokenContext);



    const friendsRef = useRef();

    const [postModal, setPostModal] = useState(false);


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
    const newPostRequest = async (isPublic, e, accessTokenParam)=>{
        e.preventDefault();

        let content = sanitizeHtml(newPostContent,defaultSanitizeOptions);


        const friendsArr = [];
        let selectedCnt = 0;

        friendsRef.current?.childNodes.forEach(node=>{

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

        if(!accessTokenParam){

            for(let i = 0;i<imageList.length;i++){

                const image = imageList[i].file;
                const imageId = imageList[i].id;

                await uploadImage(image, imageId);
            }

        }


        const formData = new FormData();
        const newPost = {
            accountId:profileAccount?.id,
            content,
            visibleToFollowers,
            friendsVisibilityType,
            visibleToFriendList
        };
        Object.entries(newPost).forEach(([k,v])=>{

            formData.append(k,v);

        });

        console.log("form:  ",formData);

        axios({
            method: 'POST',
            url: import.meta.env.VITE_POST_SERVICE+"/create",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
            },
            withCredentials:true
        })
            .then( async (res)=>{

                const data = res.data;
//public or private
                if(data.visibleToFollowers&& !data.friendsVisibilityType){
                    setPostsArr(prevState => [data,...prevState]);
                }

                newPostEditor.commands.clearContent();
                setNewPostContent("");
                setNewPostImageList([]);
                setNewPostLoader(false);




            })
            .catch(err=>{
                if(err.response.status === 401){

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
                                await newPostRequest(isPublic, e, data.access_token);
                            }
                            else{
                                setLogout(true);
                            }

                        })
                        .catch(err=>console.error(err));

                }
                else {
                    setDangerToast("An Error Ocurred");
                    console.error(err);
                }

            });

    };
    const friendRequest = ()=>{


        notificationStompClient.send(
            "/addFriend",
            {},
            JSON.stringify({
                addingId:account?.id,
                addedId:profileAccount?.id,
                isRequest:true,
                isAccepted:false
            }));

        setFriendRequestInProcess(true);

    };
    const unFriendRequest = (accessTokenParam)=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/unFriend",{
            method:"POST",
            body:JSON.stringify({
                removingId:account?.id,
                removedId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
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
                                unFriendRequest(data.access_token);
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
    const followRequest = (accessTokenParam)=>{

        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/follow",{
            method:"POST",
            body:JSON.stringify({
                followerId:account?.id,
                followeeId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const newFollowerList = [...account?.followerList, id];

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
                                followRequest(data.access_token);
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
    const unFollowRequest = (accessTokenParam)=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/unFollow",{
            method:"POST",
            body:JSON.stringify({
                followerId:account?.id,
                followeeId:profileAccount?.id
            }),
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenParam||accessToken}`
            },
            credentials:"include"
        })
            .then(async (res)=>{
                if(res.status === 200){
                    const newFollowerList = account?.followerList.filter(follower=> (follower.id || follower) !== profileAccount?.id);

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
                                unFollowRequest(data.access_token);
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
    const fetchProfilePosts = async (accessTokenParam)=>{

        const isAccountProfile = Number( Number(id) === Number(account?.id) );
        console.log(isAccountProfile);

        try{
            const res = await fetch(import.meta.env.VITE_POST_SERVICE+"/profile/"+id+"/"+isAccountProfile,{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials:"include"
            });
            if(res.status === 200){
                const data = await res.json();

                console.log("data: ",data);

                setPostsArr([...data.reverse()]);

            }
            else if(res.status === 401){
              const tokenRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                    method:"GET",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    credentials:"include"
                });
                if(tokenRes.status === 200){
                    const data = await tokenRes.json();
                    setAccessToken(data.access_token);
                    await fetchProfilePosts(data.access_token);
                }
                else{
                    setLogout(true);
                }
            }
            else{
                console.error(res.statusText);
            }

        }
        catch(e){
            console.error(e);
        }

    };
    const checkFriendRequestInProcess = async (accessTokenParam)=>{

        try{
            const res = await fetch(import.meta.env.VITE_NOTIFICATIONS_SERVICE+"/checkFriendRequest/"+account?.id+"/"+id,{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials:"include"
            });
            if(res.status === 200){
                const data = await res.json();

                setFriendRequestInProcess(data);

            }
            else if(res.status === 401){
             const tokenRes = await fetch(import.meta.env.VITE_REFRESH_TOKEN,{
                    method:"GET",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    credentials:"include"
                });
                if(tokenRes.status === 200){
                    const data = await tokenRes.json();
                    setAccessToken(data.access_token);
                    await checkFriendRequestInProcess(data.access_token);
                }
                else{
                    setLogout(true);
                }
            }
            else{
                console.error(res.statusText);
            }

        }
        catch (e) {
            console.error(e);
        }
    };


    const postBtnContent = <div role="tooltip"
                                className="w-64 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">

        <div
            className="px-3 py-2 bg-gray-100 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Post</h3>
        </div>

        <div className="px-3 py-2 flex flex-col gap-1">
            <div
                onClick={e=>{
                    if(!newPostLoader){
                        setNewPostLoader(true);
                        newPostRequest(true, e);
                    }
                }}
                className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1 flex justify-between items-center"
            >
                <p>In your profile</p>
                {
                    newPostLoader &&
                    <div
                        className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
                        role="status" aria-label="loading">
                        <span className="sr-only">Loading...</span>
                    </div>
                }
            </div>

            <div
                className="cursor-pointer transition-colors duration-300 transform rounded-md hover:bg-gray-700 p-1"
                onClick={()=>setPostModal(true)}
            >
                <p>With your friends</p>
            </div>

        </div>

    </div>;





    useEffect(()=>{
    
        fetchAccount(id)
        .then((profileAccountRes)=>{
            setProfileAccount({...profileAccountRes});
            checkFriendRequestInProcess()
            .then(()=>{
                    fetchProfilePosts();
            });
        });

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
                   Boolean(profileAccount) && Boolean(Number(account?.id) !== Number(id)) &&
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
                                friendRequestInProcess?
                                    <div
                                        className="text-gray-900 bg-white border border-gray-300 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 flex items-center justify-between gap-2">
                                        <p>Friend Request</p>
                                        <div
                                            className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500"
                                            role="status" aria-label="loading">
                                            <span className="sr-only">Loading...</span>
                                        </div>

                                    </div>
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
                          Boolean(account?.id !== profileAccount?.id) && Boolean(account?.followerList.find(follower=>(follower.id || follower) === profileAccount?.id))?
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
                                profileAccount?.friendList.map(friend=>{
                                    return(
                                        <li key={`profile-friend-${friend.id}-${id}`} className="flex justify-between">

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
                        <div className="p-2 rounded-md shadow-md bg-gray-800">

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

                                <Tooltip content={postBtnContent} placement={"bottom"} trigger={"click"} className={"m-0 p-0"} >
                                    <button
                                        className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600 h-[3rem]">Post
                                    </button>
                                </Tooltip>

                                <Modal dismissible show={postModal} onClose={() => setPostModal(true)}>

                                        <div className="flex flex-col border shadow-sm rounded-xl bg-gray-800 border-gray-700 shadow-slate-700/[.7]">
                                            <Modal.Header className="font-bold text-gray-800 dark:text-white">
                                                New Post
                                            </Modal.Header>
                                            <Modal.Body>
                                                <div className="p-4 overflow-y-auto">
                                                    <div className="p-6 space-y-6">
                                                        <div className="p-6 space-y-6 bg-gray-700 rounded-md overflow-y" ref={friendsRef}>
                                                            {
                                                                profileAccount?.friendList.map(friend=>{
                                                                    return <div
                                                                        key={`newPost-profile-friend-${friend.id}-${id}`}
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
                                                                           tabIndex="0" role="link">{friend.userName}</p>


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
                                            </Modal.Body>





                                    </div>
                                </Modal>


                            </div>
                        </div>

                    }
                    {
                        postsArr.map(post=>{

                            return(
                                <Post key={`post-${post.id}-${id}`} postProp={post} id={post.id} account={account} fetchAccount={fetchAccount} setPostsArr={setPostsArr} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast}   />
                            );
                        })
                    }


        </div>


</div>






</div>
    );
}

export default Profile;