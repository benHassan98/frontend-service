import {useContext, useRef, useState, useEffect} from 'react';
import axios from 'axios';
import {AccessTokenContext} from "./AccessTokenProvider.jsx";
import {useCookies} from "react-cookie";
import {useNavigate} from "react-router-dom";
import {v4 as uuidv4} from 'uuid';

function Settings({account, fetchAccount, setAccount, setSuccessToast,  setInfoToast, setDangerToast}){

    const [image, setImage] = useState(null);
    const aboutMeRef = useRef();

    const {accessToken, setAccessToken} = useContext(AccessTokenContext);
    const [, , removeCookie] = useCookies();
    const navigate = useNavigate();


    const verifyAccountRequest = ()=>{

        const token = {
            accountEmail:account?.email,
            type:"verifyAccount"
        };


        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/token/create",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
            },
            body:JSON.stringify(token),

        })
            .then(res=>{
                if(res.status === 200){
                    setInfoToast("Please check your inbox for confirmation");
                }
                else if(res.status === 401){
                    fetch(import.meta.env.VITE_REFRESH_TOKEN, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include"
                    })
                        .then(async (res) => {
                            if (res.status === 200) {
                                const data = await res.json();
                                setAccessToken(data.access_token);
                                verifyAccountRequest();
                            } else {
                                removeCookie("refresh_token");
                                removeCookie("JSESSIONID");
                                setAccessToken(null);
                                navigate("/login");
                            }

                        })
                        .catch(err => console.error(err));

                }
                else{
                 setDangerToast("An error has occurred please try again later");
                 throw new Error(res.statusText);
                }
            })
            .catch(err=>console.error(err));

    };
    const updateRequest = (e)=>{

        if(e){e.preventDefault();}

        const formData = new FormData();

        const newAccount = {
            ...account,
            aboutMe:aboutMeRef.current.value
        };

        Object.entries(newAccount).forEach(([k, v])=>{
            formData.append(k,v);
        });

        if(image.id){
            formData.append("name",image.id);
            formData.append("file",image.file);
        }
        formData.delete("url");
        formData.delete("image");

        console.log("updateFormData: ",formData);
        axios({
            method: 'PUT',
            url: import.meta.env.VITE_ACCOUNT_SERVICE+"/update",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": `Bearer  ${accessToken}`
            },
            withCredentials: true
        }).then(async (res) => {
            if (res.status === 200) {
                const data = await fetchAccount(account.id);

                setAccount({...data});
                setSuccessToast("Account Updated");


            } else if (res.status === 401) {
                fetch(import.meta.env.VITE_REFRESH_TOKEN, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include"
                })
                    .then(async (res) => {
                        if (res.status === 200) {
                            const data = await res.json();
                            setAccessToken(data.access_token);
                            updateRequest();
                        } else {
                            removeCookie("refresh_token");
                            removeCookie("JSESSIONID");
                            setAccessToken(null);
                            navigate("/login");
                        }

                    })
                    .catch(err => console.error(err));
            } else {
                setDangerToast("An Error ocurred");
                throw new Error(res.statusText);
            }

        })
            .catch(err => console.error(err));


    };

    useEffect(()=>{
if(account){
    setImage({
        url:account.picture
    });
    aboutMeRef.current.textContent = account.aboutMe || "About Me";
}
    },[account]);



    return (
        <div className="flex flex-col justify-center items-center mt-5">

            <div className="flex flex-col justify-between w-[35rem] h-[30rem]">
                <h2 className="text-4xl text-white">Settings</h2>
                <div className="flex items-center gap-1">

                    {
                        account?.verified?
                            <div className="flex gap-1">
                                <div className="text-gray-900 bg-white border border-gray-300 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 flex gap-1 items-center">
                                    Account Verified
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{color:'white'}} className="w-5 h-5"
                                         viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                              d="m9 19.414l-6.707-6.707l1.414-1.414L9 16.586L20.293 5.293l1.414 1.414z"/>
                                    </svg>
                                </div>

                                <button type="button"
                                        className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                                        onClick={()=>navigate("/forgetPassword")}
                                >
                                    Change Password
                                </button>
                            </div>
                            :
                            <button type="button"
                                className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                                    onClick={()=>verifyAccountRequest()}
                            >
                            Verify Account
                        </button>

                    }


                </div>


                <div className="flex flex-col ">
                    <h2 className="text-white mb-4">Profile Picture</h2>

                    <div className="flex items-center">

                        <div className="w-20 h-20 overflow-hidden rounded-full">
                            <img
                                src={image?.url}
                                className="object-cover w-full h-full" alt="avatar"/>
                        </div>

                        <div className="ml-2">

                            <label htmlFor={"imageInput"}
                                    className="cursor-pointer text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                Change
                            </label>
                            <input
                                id={"imageInput"}
                                type="file"
                                accept="image/*"
                                onChange={(e)=>{
                                    const newImage = e.target.files[0];
                                    const newImageUrl = URL.createObjectURL(newImage);
                                    const newImageId = uuidv4();

                                    setImage({
                                        id:newImageId,
                                        url:newImageUrl,
                                        file:newImage
                                    });


                                }}
                                className={"hidden"}
                            />

                        </div>

                    </div>


                </div>


                <div className="flex flex-col">


                    <label htmlFor="aboutMeText"
                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white ml-1">
                        About Me
                    </label>
                    <textarea id="aboutMeText" rows="4"
                              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                              style={{resize:"none"}}
                              ref={aboutMeRef}

                    ></textarea>
                    <div className=" mt-2 self-end">
                        <button
                            onClick={(e)=>updateRequest(e)}
                            type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Update
                        </button>
                    </div>

                </div>


            </div>


        </div>


);
}

export default Settings;