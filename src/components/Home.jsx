import {useContext, useEffect, useRef, useState} from "react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {Link, useNavigate} from "react-router-dom";
import {EditorContent, useEditor} from "@tiptap/react";
import sanitizeHtml from "sanitize-html";
import parse from "html-react-parser";
import axios from "axios";
import {Modal, Tooltip} from "flowbite-react";
import Post from "./Post.jsx";
import {v4 as uuidv4} from 'uuid';
import {uploadImage} from "./FireBaseConfig.js";



function Home({account, fetchAccount, setSuccessToast, setDangerToast}){

    const [newUsersArr, setNewUsersArr] = useState([]);
    const [postsArr, setPostsArr] = useState([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostImageList, setNewPostImageList] = useState([]);
    const [isVisibleToFollowers, setIsVisibleToFollowers] = useState(false);
    const [newPostLoader, setNewPostLoader] = useState(false);


    const extensions = [
        StarterKit,
        Image.configure({

            HTMLAttributes:{
                class:"w-32 h-32",

            }
        }),

    ];


    const {accessToken, setAccessToken, setAccessTokenIsNull, setLogout} = useContext(AccessTokenContext);
    const [,,removeCookie] = useCookies();
    const navigate = useNavigate();

    const friendsRef = useRef();

    const [newPostModal, setNewPostModal] = useState(false);

    
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

        if(!accessTokenParam){

            for(let i = 0;i<imageList.length;i++){

                const image = imageList[i].file;
                const imageId = imageList[i].id;

                await uploadImage(image, imageId);

            
            }

        }

        imageList.forEach(image=>{
            content = content.replace(image.url, image.id);
            URL.revokeObjectURL(image.url);
        });


        const formData = new FormData();
        const newPost = {
            accountId:account?.id,
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
                console.log("newPost Home:  ",data);
                setPostsArr(prevState => [data,...prevState]);

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
                    setDangerToast("An Error Occurred");
                    console.error(err);
                }





            });

    };
    const fetchHomePosts = async (accessTokenParam)=>{

        try{
             const res =  await fetch(import.meta.env.VITE_POST_SERVICE+"/account/"+account?.id,{
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
                    fetchHomePosts(data.access_token);
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
    const fetchNewUsers = async (accessTokenParam)=>{

        try{
            const res = await fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/newUsers",{
                method:"GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessTokenParam||accessToken}`
                },
                credentials:"include"
            });
            if(res.status === 200){
                const data = await res.json();
                const tempNewUsersArr = [];
                for(let i =0;i<data.length;i++){
                    console.log("newUser id: ",data[i]);
                    const newUser = await fetchAccount(data[i]);
                    tempNewUsersArr.push(newUser);
                }

                console.log("newUsers: ",tempNewUsersArr);
                setNewUsersArr([...tempNewUsersArr]);

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
                    fetchNewUsers(data.access_token);
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

    const newPostBtnContent = <div role="tooltip"
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
                onClick={()=>setNewPostModal(true)}
            >
                <p>With your friends</p>
            </div>

        </div>

    </div>;


    useEffect(()=>{

    fetchHomePosts()
        .then(()=>{
            fetchNewUsers();
        });


    },[]);



    return (
        <div className="flex" >
            <div className="flex flex-col flex-1 p-2">
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
                                    const newImageId = uuidv4();


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

                        <Tooltip content={newPostBtnContent} placement={"bottom"} trigger={"click"}  className={"m-0 p-0"} >
                            <button
                                className="px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600 h-[3rem]">Post
                            </button>
                        </Tooltip>

                        <Modal dismissible show={newPostModal} onClose={() => setNewPostModal(false)}>

                            <div className="flex flex-col border shadow-sm rounded-xl bg-gray-800 border-gray-700 shadow-slate-700/[.7]">
                                <Modal.Header className="font-bold text-gray-800 dark:text-white">
                                    New Post
                                </Modal.Header>
                                <Modal.Body>
                                    <div className="p-4 overflow-y-auto">
                                        <div className="p-6 space-y-6">
                                            <div className="p-6 space-y-6 bg-gray-700 rounded-md overflow-y" ref={friendsRef}>
                                                {
                                                    account?.friendList.map(friend=>{
                                                        return <div
                                                            key={`newPost-profile-friend-${friend.id}-${account?.id}`}
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


                {
                    postsArr.map(post=>{

                        return(
                            <Post key={`home-post-${post.id}-account-${account?.id}`} postProp={post} id={post.id} account={account} fetchAccount={fetchAccount} setPostsArr={setPostsArr} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast}   />
                        );
                    })
                }



        </div>
    <div className="flex flex-col w-[25rem] p-4">
        <h3 className="text-white text-3xl mb-4">New Users</h3>
        <ul className="flex flex-col">


            {

                newUsersArr.map(newUser=>{

                    return (<li key={`newUsers-${newUser.id}-account-${account?.id}`}
                                className="flex justify-between mt-2">

                        <div className="flex items-center">
                            <img className="hidden object-cover w-10 h-10 mr-2 rounded-full sm:block" src={newUser.picture} alt="avatar"/>
                            <Link className="font-bold text-gray-700 cursor-pointer dark:text-gray-200" tabIndex="0" role="link" to={"/profile/"+newUser.id}>{newUser.userName}</Link>
                        </div>
                    </li>);




                })


            }

        </ul>

    </div>


</div>
    );
}



export default Home;