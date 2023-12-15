import {useState, createContext} from "react";
const AccessTokenContext = createContext();
const AccessTokenProvider = ({children})=>{
    const [accessToken, setAccessToken] = useState(null);
    const [accessTokenIsNull, setAccessTokenIsNull] = useState(true);
    const [logout, setLogout] = useState(null);
    return(
        <AccessTokenContext.Provider value={{
            accessToken, setAccessToken, accessTokenIsNull, setAccessTokenIsNull, logout, setLogout
        }}>
            {children}
        </AccessTokenContext.Provider>
    );



};


export {AccessTokenContext, AccessTokenProvider};
