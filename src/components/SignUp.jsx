import {useRef} from "react";
import {useNavigate} from "react-router-dom";




function SignUp() {
const fullNameRef = useRef();
const fullNameErrRef = useRef();
const userNameRef = useRef();
const userNameErrRef = useRef();
const emailRef = useRef();
const emailErrRef = useRef();
const passwordRef = useRef();
const passwordErrRef = useRef();
const passwordConfirmRef = useRef();
const passwordConfirmErrRef = useRef();
const navigate = useNavigate();
const signUpRequest = (e)=>{
    e.preventDefault();
    const inputNames = ["fullName","userName","email","password","passwordConfirm"];
    const refObj = {
        fullName:fullNameRef,
        fullNameErr:fullNameErrRef,
        userName:userNameRef,
        userNameErr:userNameErrRef,
        email:emailRef,
        emailErr:emailErrRef,
        password:passwordRef,
        passwordErr:passwordErrRef,
        passwordConfirm:passwordConfirmRef,
        passwordConfirmErr:passwordConfirmErrRef
    };
    inputNames.forEach(name=>{
        refObj[name].current.classList.remove("border-red-600");
        refObj[name].current.classList.add("border-gray-600");
        refObj[name+"Err"].current.textContent = "";

    });

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body:JSON.stringify(inputNames.reduce((previousValue,currentValue)=>{
            let newField = {};
            newField[currentValue] = refObj[currentValue].current.value;
            return {...previousValue,...newField};

        },{})),
        credentials:"include"

    };

    if(passwordConfirmRef.current.value !== passwordRef.current.value){
        passwordConfirmRef.current.classList.remove("border-gray-600");
        passwordConfirmRef.current.classList.add("border-red-600");
        passwordConfirmErrRef.current.textContent = "Password Confirm should match password";
        return;
    }
    fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/create",requestOptions)
        .then(async (res) => {

            const data = await res.json();
            if (res.status === 200) {
                navigate("/login");
            } else if (res.status === 400) {

                data.forEach(error=>{
                    const {defaultMessage} = error;
                    const field = error.field ||
                        inputNames.
                        filter(name=>defaultMessage.toLowerCase().includes(name))[0];

                    refObj[field].current.classList.remove("border-gray-600");
                    refObj[field].current.classList.add("border-red-600");
                    refObj[field+"Err"].current.textContent =
                        refObj[field+"Err"].current.textContent || defaultMessage;

                });

            } else {
                throw new Error(res.statusText);

            }
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
                    <label htmlFor="fullName" className="block text-sm text-gray-200">Full name</label>
                    <input type="text" id="fullName" ref={fullNameRef}
                           className="block w-full px-4 py-2 mt-2 text-white border rounded-lg bg-gray-800 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500" ref={fullNameErrRef}></p>
                </div>

                <div className="mt-4">

                    <label htmlFor="userName" className="block text-sm text-gray-200">Username</label>
                    <input type="text" id="userName" ref={userNameRef}
                           className="block w-full px-4 py-2 mt-2 text-white border rounded-lg bg-gray-800 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500" ref={userNameErrRef}></p>
                </div>

                <div className="mt-4">

                    <label htmlFor="email" className="block text-sm text-gray-200">Email</label>
                    <input type="email" id="email" ref={emailRef}
                           className="block w-full px-4 py-2 mt-2 text-white border rounded-lg bg-gray-800 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500" ref={emailErrRef}></p>
                </div>


                <div className="mt-4">

                    <label htmlFor="password" className="block text-sm text-gray-200">Password</label>
                    <input type="password" id="password" ref={passwordRef}
                           className="block w-full px-4 py-2 mt-2 text-white border rounded-lg bg-gray-800 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500" ref={passwordErrRef}></p>
                </div>


                <div className="mt-4">

                    <label htmlFor="passwordConfirm" className="block text-sm text-gray-200">Password Confirm</label>
                    <input type="password" id="passwordConfirm" ref={passwordConfirmRef}
                           className="block w-full px-4 py-2 mt-2 text-white border rounded-lg bg-gray-800 border-gray-600 focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500" ref={passwordConfirmErrRef}></p>
                </div>

                <div className="flex items-center mt-6 -mx-2">
                    <button
                            onClick={(e)=>signUpRequest(e)}
                            type="button"
                            className="flex items-center justify-center w-full px-6 py-2 mx-2 text-sm font-medium text-white transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:bg-blue-400 focus:outline-none">
                        <span className="hidden mx-2 sm:inline">Sign Up</span>
                    </button>


                </div>
                <div className="mt-3">
                    <button
                        // onClick={()=>navigate("/")}
                        className="w-full px-6 py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                        Cancel
                    </button>
                </div>


            </form>


        </div>


    </div>

);

}

export default SignUp;