import {useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useCookies} from "react-cookie";

function EmailForm(){
    const emailRef = useRef();
    const navigate = useNavigate();
    const [cookies] = useCookies(['XSRF-TOKEN']);
    const sendLinkRequest = (e)=>{
        e.preventDefault();
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
            },
            body:JSON.stringify({
                token:{
                    accountEmail:emailRef.current.value,
                    type:"resetPassword"
                }
            }),
            credentials:"include"

        };

        fetch(import.meta.env.VITE_API_URL+"/token/create",requestOptions)
            .then(res=>{
                if(res.status === 500){
                    return Promise.reject(500);
                }
                navigate("/login");
            })
            .catch(err=>console.error(err));

    };

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="w-full max-w-sm p-6 m-auto mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="flex justify-center mx-auto">
                    <h1 className="text-white text-4xl">Odin Book</h1>
                </div>

                <form className="mt-6">
                    <div>
                        <label htmlFor="email" className="block text-sm text-gray-800 dark:text-gray-200">Email</label>
                        <input type="text"
                               className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                               ref={emailRef}
                        />
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={(e)=>sendLinkRequest(e)}
                            className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                            Send Link
                        </button>
                    </div>
                </form>

            </div>

        </div>
    );
}
export default EmailForm;