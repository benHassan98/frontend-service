import React from 'react';
import {useParams} from "react-router-dom";
import Post from "./Post.jsx";
function PostPage ({account, fetchAccount, setToast}){

    const {id} = useParams();


    return (

        <div className="flex flex-col justify-center items-center">

            <div className="flex flex-col justify-between w-[45rem] h-[30rem] hs-accordion-group">

                <Post id={id} account={account} fetchAccount={fetchAccount} setToast={setToast} withCommentAccordion={false} />

            </div>

        </div>

    );
}


export default PostPage;