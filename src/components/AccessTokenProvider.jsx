import {useState, createContext} from "react";
const AccessTokenContext = createContext();
const AccessTokenProvider = ({children})=>{
    const [accessToken, setAccessToken] = useState(null);
    return(
        <AccessTokenContext.Provider value={{accessToken, setAccessToken}}>
            {children}
        </AccessTokenContext.Provider>
    );



};


export {AccessTokenContext, AccessTokenProvider};
