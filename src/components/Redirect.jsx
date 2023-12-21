import {useNavigate, useSearchParams} from "react-router-dom";
import {useContext, useEffect} from "react";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";

function Redirect({setDangerToast, setSuccessToast}){
    const navigate = useNavigate();
    const {accessTokenIsNull} = useContext(AccessTokenContext);
    const [params,] = useSearchParams();
    const code = params.get("token");

    const verifyToken = (accountEmail)=>{

        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/verify",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                email:accountEmail,
            }),
            credentials:"include",
        })
            .then(res=>{
                if(res.status === 500){
                    return Promise.reject(500);
                }
                else if(res.status === 200){
                    setSuccessToast("Email Verified");
                    if(accessTokenIsNull){
                        navigate("/login");
                    }
                    else{
                        navigate("/");
                    }
                }
                else {
                    throw new Error(res.statusText);
                }
            })
            .catch(err=>console.error(err));

    }


    const redirectRequest = ()=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/token/verify",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                code
            }),
            credentials:"include",
        })
            .then(async (res)=>{
                if(res.status === 500){
                    return Promise.reject(500);
                }
                else if(res.status === 400){
                    setDangerToast("Token is expired");
                    if(accessTokenIsNull){
                        navigate("/login");
                    }
                    else{
                        navigate("/");
                    }
                }
                else{
                    const token = await res.json();
                    if(token.type === "resetPassword"){
                        navigate("/resetPassword",{
                            state:{
                                accountEmail:token.accountEmail,
                            }
                        });
                    }
                    else{
                        verifyToken(token.accountEmail);
                    }



                }







            })
            .catch(err=>console.error(err));




    };


    useEffect(()=>{

        redirectRequest();

    },[]);

    return(
        <>
        </>
    );
}
export default Redirect;