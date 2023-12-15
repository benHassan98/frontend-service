import {useContext, useRef} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";

function NewPasswordForm({setSuccessToast, setDangerToast}){
    const passwordRef = useRef();
    const passwordErrRef = useRef();
    const passwordConfirmRef = useRef();
    const passwordConfirmErrRef = useRef();
    const navigate = useNavigate();
    const {logout} = useContext(AccessTokenContext);
    const location = useLocation();
    const resetPasswordRequest = (e)=>{
        e.preventDefault();

        if(passwordRef.current.value.trim().length < 6 || passwordRef.current.value.trim().length > 40){
            passwordErrRef.current.textContent = "Size must be between 6 and 40";
            return;
        }

        if(passwordConfirmRef.current.value !== passwordRef.current.value){
            passwordConfirmErrRef.current.textContent = "Password Confirm should match password";
            return;
        }

        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                email:location.state.accountEmail,
                newPassword:passwordRef.current.value,

            }),
            credentials:"include"

        };

        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/resetPassword",requestOptions)
            .then(res=>{
                if(res.status === 200){
                    setSuccessToast("Password reset");
                    if(logout){
                        navigate("/login");
                    }
                    else{
                        navigate("/");
                    }
                }
                else{
                    setDangerToast("An error has occurred please try again later");
                    throw new Error(res.statusText);
                }
            })
            .catch(err=>console.error(err));


    };


    return (
        <>
            <div className="flex flex-col justify-center items-center w-screen h-screen">
                <div className="w-full max-w-sm p-6 m-auto mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
                    <div className="flex justify-center mx-auto">
                        <h1 className="text-white text-4xl">Odin Book</h1>
                    </div>

                    <form className="mt-6">
                        <div>
                            <label htmlFor="password" className="block text-sm text-gray-800 dark:text-gray-200">New
                                Password</label>
                            <input type="password"
                                   className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                                   ref={passwordRef}
                            />
                            <p
                                className="mt-4 text-sm text-red-600 dark:text-red-500"
                                ref={passwordErrRef}

                            ></p>
                        </div>


                        <div className="mt-4">
                            <label htmlFor="passwordConfirm" className="block text-sm text-gray-800 dark:text-gray-200">Confirm
                                Password</label>
                            <input type="password"
                                   className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                                   ref={passwordConfirmRef}
                            />
                            <p
                                className="mt-4 text-sm text-red-600 dark:text-red-500"
                                ref={passwordConfirmErrRef}

                            ></p>
                        </div>



                        <div className="mt-6">
                            <button
                                className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50"
                                onClick={(e)=>resetPasswordRequest(e)}
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>


                </div>

            </div>
        </>
    );
}
export default NewPasswordForm;