import {useLocation, useNavigate} from "react-router-dom";
import {useCookies} from "react-cookie";
import {useEffect} from "react";

function Redirect({setDangerToast,setSuccessToast}){
    const [cookies] = useCookies(["XSRF-TOKEN"]);
    const navigate = useNavigate();
    const {search} = useLocation();
    const params = new URLSearchParams(search);
    const code = params.get("verifyAccount") || params.get("resetPassword");


    useEffect(()=>{

        fetch(import.meta.env.VITE_API_URL+"/token/verify",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
            },
            body:JSON.stringify({
                code
            }),
            credentials:"include",
        })
            .then(async (res)=>{
                const isJson = res.headers
                    .get("content-type")
                    .includes("application/json");

                const data = isJson ? await res.json() : null;
                if(res.status === 500){
                    return Promise.reject(500);
                }
                else if(res.status === 400){
                    setDangerToast("Token is expired");
                    navigate("/");
                }
                else{
                    const {token} = data;
                   if(token.type === "resetPassword"){
                       navigate("/resetPassword",{
                           state:{
                               accountEmail:token.accountEmail,
                           }
                       });
                   }
                    fetch(import.meta.env.VITE_API_URL+"/account/verify",{
                        method:"POST",
                        headers:{
                            "Content-Type": "application/json",
                            "X-XSRF-TOKEN":cookies["XSRF-TOKEN"],
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
                            setSuccessToast("Email Verified");
                            navigate("/");
                        })
                        .catch(err=>console.error(err));



                }







            })
            .catch(err=>console.error(err));




    },[]);

    return(
        <>
        This is Redirect
        </>
    );
}
export default Redirect;