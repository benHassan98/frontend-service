import {Link} from "react-router-dom";

function Login({setInfoToast}) {



    return (

        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="w-full max-w-sm p-6 m-auto mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="flex justify-center mx-auto">
                    <h1 className="text-white text-4xl">Odin Book</h1>
                </div>

                <form className="mt-6">
                    <div>
                        <label htmlFor="username"
                               className="block text-sm text-gray-800 dark:text-gray-200">Username</label>
                        <input type="text"
                               className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password"
                                   className="block text-sm text-gray-800 dark:text-gray-200">Password</label>
                            <a href="#" className="text-xs text-gray-600 dark:text-gray-400 hover:underline">Forget
                                Password?</a>
                        </div>

                        <input type="password"
                               className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"/>
                    </div>

                    <p className="mt-4 text-sm text-red-600 dark:text-red-500"></p>

                    <div className="mt-6">
                        <button
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
                    <button type="button"
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