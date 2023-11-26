import React from 'react';
import {useParams} from "react-router-dom";
import Post from "./Post.jsx";
function PostPage ({account, fetchAccount, setSuccessToast, setDangerToast}){

    const {id} = useParams();


    return (

        <div className="flex flex-col justify-center items-center">

            <div className="flex flex-col justify-between w-[45rem] h-[30rem]">

                <Post id={id} account={account} fetchAccount={fetchAccount} setSuccessToast={setSuccessToast} setDangerToast={setDangerToast} />
            </div>

        </div>

    );
}


export default PostPage;