import {Link, useNavigate} from "react-router-dom";
import {useRef} from "react";
import {useCookies} from "react-cookie";
function Login({ setAccount, setInfoToast }) {
const emailRef = useRef();
const passwordRef = useRef();
const errRef = useRef();
const [cookies] = useCookies(["XSRF-TOKEN"]);
const navigate = useNavigate();
const signinRequest = (e)=>{
    e.preventDefault();
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
        },
        body:JSON.stringify({
            username:emailRef.current.value,
            password:passwordRef.current.value,
        }),
        credentials:"include",

    };

    fetch(import.meta.env.VITE_API_URL+"/perform_login",requestOptions)
        .then(async (res)=>{
            const isJson = res.headers
                .get("content-type")
                .includes("application/json");

            const data = isJson ? await res.json() : null;
            if(res.status === 200){

                setAccount(data.account);
                if(!data.account.isVerified){
                    setInfoToast("please check your inbox to verify your email");
                }
                navigate("/");
            }
            else if(res.status === 401){
                errRef.current.textContent = "Invalid email or password";
            }
            else{
                return Promise.reject(res.status);
            }





        })
        .catch(err=>console.error(err));




};

const guestSigninRequest = (e)=>{
    e.preventDefault();
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
        },
        body:JSON.stringify({
            username:import.meta.env.VITE_GUEST_EMAIL,
            password:import.meta.env.VITE_GUEST_PASSWORD,
        }),
        credentials:"include",

    };

    fetch(import.meta.env.VITE_API_URL+"/perform_login",requestOptions)
        .then(async (res)=>{
            const isJson = res.headers
                .get("content-type")
                .includes("application/json");

            const data = isJson ? await res.json() : null;
            if(res.status === 200){

                setAccount(data.account);
                navigate("/");
            }
            else{
                return Promise.reject(res.status);
            }

        })
        .catch(err=>console.error(err));




}





    return (

        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="w-full max-w-sm p-6 m-auto mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="flex justify-center mx-auto">
                    <h1 className="text-white text-4xl">Odin Book</h1>
                </div>

                <form className="mt-6">
                    <div>
                        <label htmlFor="email"
                               className="block text-sm text-gray-800 dark:text-gray-200">Email</label>
                        <input type="text"
                               className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                               ref={emailRef}
                        />
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password"
                                   className="block text-sm text-gray-800 dark:text-gray-200">Password</label>
                            <Link to={"/forgetPassword"} className="text-xs text-gray-600 dark:text-gray-400 hover:underline">Forget
                                Password?</Link>
                        </div>

                        <input type="password"
                               className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                               ref={passwordRef}
                        />
                    </div>

                    <p className="mt-4 text-sm text-red-600 dark:text-red-500" ref={errRef}></p>

                    <div className="mt-6">
                        <button
                            onClick={(e)=>signinRequest(e)}
                            className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                            Sign In
                        </button>
                    </div>
                </form>

                <div className="flex items-center justify-between mt-4">
                    <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>

                    <p  className="text-xs text-center text-gray-500 uppercase dark:text-gray-400">
                        or login as a Guest
                    </p>

                    <span className="w-1/5 border-b dark:border-gray-400 lg:w-1/5"></span>
                </div>

                <div className="flex items-center mt-6 -mx-2">
                    <button
                            onClick={(e)=>guestSigninRequest(e)}
                            type="button"
                            className="flex items-center justify-center w-full px-6 py-2 mx-2 text-sm font-medium text-white transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:bg-blue-400 focus:outline-none">
                        <span className="hidden mx-2 sm:inline">Sign in as Guest</span>
                    </button>


                </div>

                <p className="mt-8 text-xs font-light text-center text-gray-400"> Don&apos;t have an account? <Link to={"/signup"}
                                                                                                            className="font-medium text-gray-700 dark:text-gray-200 hover:underline">Create
                    One</Link></p>
            </div>

        </div>




    );
}



export default Login;