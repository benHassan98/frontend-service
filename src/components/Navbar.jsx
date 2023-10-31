import React from 'react';
import {Link} from 'react-router-dom';
function Navbar({account}) {

    return(
// <div className="flex flex-col">
        <nav className="sticky top-0 z-50 shadow bg-gray-900">
            <div className="container px-6 py-4 mx-auto">
                <div className="lg:flex lg:items-center lg:justify-between">
                    <div className="flex items-center justify-between">
                        <Link to="/">
                            <h1 className="text-white text-4xl">Odin Book</h1>
                        </Link>


                    </div>
                    { account &&

                        <div
                            className="absolute inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-gray-800 lg:mt-0 lg:p-0 lg:top-0 lg:relative lg:bg-transparent lg:w-auto lg:opacity-100 lg:translate-x-0 lg:flex lg:items-center">


                            <div className="flex items-center mt-4 lg:mt-0">


                                <button type="button" className="flex items-center focus:outline-none"
                                        aria-label="toggle profile dropdown">
                                    <div
                                        className="w-10 h-10 overflow-hidden rounded-full">
                                        <img
                                            src={account.imageUrl}
                                            className="object-cover w-full h-full" alt="avatar"/>
                                    </div>

                                    <h3 className="px-3 py-2 mx-1 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{account.userName}</h3>
                                </button>

                                <div className="hs-dropdown relative inline-block [--placement:bottom]">

                                    <button
                                        className="hs-dropdown-toggle relative z-10 block p-2 text-gray-700 border border-transparent rounded-md dark:text-white focus:border-blue-500 focus:ring-opacity-40 dark:focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-400 focus:ring bg-gray-900 focus:outline-none mr-2">
                                        <svg className="w-6 h-6 text-gray-800 dark:text-white" viewBox="0 0 24 24"
                                             fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M12 22C10.8954 22 10 21.1046 10 20H14C14 21.1046 13.1046 22 12 22ZM20 19H4V17L6 16V10.5C6 7.038 7.421 4.793 10 4.18V2H13C12.3479 2.86394 11.9967 3.91762 12 5C12 5.25138 12.0187 5.50241 12.056 5.751H12C10.7799 5.67197 9.60301 6.21765 8.875 7.2C8.25255 8.18456 7.94714 9.33638 8 10.5V17H16V10.5C16 10.289 15.993 10.086 15.979 9.9C16.6405 10.0366 17.3226 10.039 17.985 9.907C17.996 10.118 18 10.319 18 10.507V16L20 17V19ZM17 8C16.3958 8.00073 15.8055 7.81839 15.307 7.477C14.1288 6.67158 13.6811 5.14761 14.2365 3.8329C14.7919 2.5182 16.1966 1.77678 17.5954 2.06004C18.9942 2.34329 19.9998 3.5728 20 5C20 6.65685 18.6569 8 17 8Z"
                                                fill="currentColor"></path>
                                        </svg>
                                    </button>


                                    <div
                                        className="absolute hs-dropdown-menu hs-dropdown-open:opacity-100 w-72 transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden z-20 transition-[margin,opacity] opacity-0 duration-300 mt-2 min-w-[15rem] bg-white shadow-md rounded-lg p-2 dark:bg-gray-800 dark:border dark:border-gray-700 dark:divide-gray-700"
                                    >
                                        <div className="py-2">
                                            <a href="#"
                                               className="flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                <img
                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                    src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                                    alt="avatar"/>
                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                    className="font-bold" href="#">Sara Salah</span> replied on
                                                    the <span className="text-blue-500 hover:underline" href="#">Upload Image</span> artical
                                                    . 2m</p>
                                            </a>
                                            <a href="#"
                                               className="flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                <img
                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                    src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                                    alt="avatar"/>
                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                    className="font-bold" href="#">Slick Net</span> start following
                                                    you . 45m</p>
                                            </a>
                                            <a href="#"
                                               className="flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                                                <img
                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                    src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                                    alt="avatar"/>
                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                    className="font-bold" href="#">Jane Doe</span> Like Your reply
                                                    on <span className="text-blue-500 hover:underline" href="#">Test with TDD</span> artical
                                                    . 1h</p>
                                            </a>
                                            <a href="#"
                                               className="flex items-center px-4 py-3 -mx-2 transition-colors duration-300 transform hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <img
                                                    className="flex-shrink-0 object-cover w-8 h-8 mx-1 rounded-full"
                                                    src="https://images.unsplash.com/photo-1502980426475-b83966705988?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=40&q=80"
                                                    alt="avatar"/>
                                                <p className="mx-2 text-sm text-gray-600 dark:text-white"><span
                                                    className="font-bold" href="#">Abigail Bennett</span> start
                                                    following you . 3h</p>
                                            </a>
                                        </div>

                                    </div>
                                </div>


                                <div className="hs-dropdown relative inline-block [--placement:bottom]">
                                    <button id="hs-dropdown-slideup-animation" type="button"
                                            className="hs-dropdown-toggle relative z-10 block p-2 text-gray-700 border border-transparent rounded-md dark:text-white focus:border-blue-500 focus:ring-opacity-40 dark:focus:ring-opacity-40 focus:ring-blue-300 dark:focus:ring-blue-400 focus:ring bg-gray-900 focus:outline-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                        </svg>
                                    </button>

                                    <div
                                        className="absolute hs-dropdown-menu hs-dropdown-open:opacity-100 w-72 transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden z-20 transition-[margin,opacity] opacity-0 duration-300 mt-2 min-w-[15rem] bg-white shadow-md rounded-lg p-2 dark:bg-gray-800 dark:border dark:border-gray-700 dark:divide-gray-700"
                                        aria-labelledby="hs-dropdown-slideup-animation">
                                        <Link to="/profile"
                                              className="block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            view profile
                                        </Link>

                                        <Link to="/settings"
                                              className="block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            Settings
                                        </Link>
                                        <hr className="border-gray-200 dark:border-gray-700 "/>
                                        <Link to="#"
                                              className="block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-300 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                                            Sign Out
                                        </Link>
                                    </div>
                                </div>


                            </div>
                        </div>
                    }


                </div>
            </div>
        </nav>
        // </div>




    );


}


export default Navbar;