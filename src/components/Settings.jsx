import {useRef, useState} from 'react';

function Settings({account, setSuccessToast,  setInfoToast, setDangerToast}){

    const [image, setImage] = useState(account.image);
    const aboutMeRef = useRef();
    const verifyAccountRequest = ()=>{

        const token = {
            accountEmail:account.email,
            type:"verifyAccount"
        };


        fetch("accountService/token/create",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify(token),

        })
            .then(res=>{
                if(res.status === 200){
                    setInfoToast("Please check your inbox for confirmation");
                }
                else{
                 setDangerToast("An error has occurred please try again later");
                }
            })
            .catch(err=>console.error(err));

    };
    const updateRequest = ()=>{


        fetch("accountService/update",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                ...account,
                image,
                aboutMe:aboutMeRef.current.value,
            }),

        })
            .then(res=>{
                if(res.status === 200){
                    setSuccessToast("Account Updated Successfully");
                }
                else{
                    setDangerToast("An error has occurred please try again later");
                }
            })
            .catch(err=>console.error(err));





    };

    return (
        <div className="flex flex-col justify-center items-center mt-5">

            <div className="flex flex-col justify-between w-[35rem] h-[30rem]">
                <h2 className="text-4xl text-white">Settings</h2>
                <div className="flex items-center gap-1">

                    {
                        account.isVerified?
                            <div className="text-gray-900 bg-white border border-gray-300 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 flex gap-1 items-center">
                                Account Verified
                                <svg xmlns="http://www.w3.org/2000/svg" style={{color:'white'}} className="w-5 h-5"
                                     viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                          d="m9 19.414l-6.707-6.707l1.414-1.414L9 16.586L20.293 5.293l1.414 1.414z"/>
                                </svg>
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
                                src={URL.createObjectURL(image)}
                                className="object-cover w-full h-full" alt="avatar"/>
                        </div>

                        <div className="ml-2">

                            <label htmlFor={"imageInput"}
                                    className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">
                                Change
                            </label>
                            <input
                                id={"imageInput"}
                                type="file"
                                accept="image/*"
                                onChange={(e)=>{
                                setImage(e.target.files[0]);
                                }}
                                style={{display:"none"}}
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
                              value={account.aboutMe|"About Me"}
                              ref={aboutMeRef}

                    ></textarea>
                    <div className=" mt-2 self-end">
                        <button
                            onClick={()=>updateRequest()}
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