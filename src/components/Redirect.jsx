import {useNavigate, useSearchParams} from "react-router-dom";
import {useCookies} from "react-cookie";
import {useContext, useEffect} from "react";
import {AccessTokenContext} from "./AccessTokenProvider.jsx";

function Redirect({setDangerToast,setSuccessToast}){
    const [, , removeCookie] = useCookies();
    const navigate = useNavigate();
    const {accessToken, setAccessToken} = useContext(AccessTokenContext);
    const [params,] = useSearchParams();
    const code = params.get("token");

    const redirectRequest = ()=>{
        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/token/verify",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer  ${accessToken}`
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
                    navigate("/");
                }
                else if(res.status === 401){
                    fetch(import.meta.env.VITE_REFRESH_TOKEN, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include"
                    })
                        .then(async (res) => {
                            if (res.status === 200) {
                                const data = await res.json();
                                setAccessToken(data.access_token);
                                redirectRequest();
                            } else {
                                removeCookie("refresh_token");
                                removeCookie("JSESSIONID");
                                setAccessToken(null);
                                navigate("/login");
                            }

                        })
                        .catch(err => console.error(err));
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

                        fetch(import.meta.env.VITE_ACCOUNT_SERVICE+"/verify",{
                            method:"POST",
                            headers:{
                                "Content-Type": "application/json",
                                "Authorization": `Bearer  ${accessToken}`
                            },
                            body:JSON.stringify({
                                email:token.accountEmail,
                            }),
                            credentials:"include",
                        })
                            .then(res=>{
                                if(res.status === 500){
                                    return Promise.reject(500);
                                }
                                else if(res.status === 200){
                                    setSuccessToast("Email Verified");
                                    navigate("/");
                                }
                                else {
                                    throw new Error(res.statusText);
                                }
                            })
                            .catch(err=>console.error(err));

                    }



                }







            })
            .catch(err=>console.error(err));




    };


    useEffect(()=>{
        if(code){
            redirectRequest();
        }


    },[]);

    return(
        <>
        </>
    );
}
export default Redirect;