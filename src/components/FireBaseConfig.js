import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

const firebaseConfig = {

    apiKey: import.meta.env.VITE_API_KEY,

    authDomain: import.meta.env.VITE_AUTH_DOMAIN,

    projectId: import.meta.env.VITE_PROJECT_ID,

    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,

    messagingSenderId: import.meta.env.VITE_SENDER_ID,

    appId: import.meta.env.VITE_APP_ID,

    measurementId: import.meta.env.VITE_MEASUREMENT_ID

};
const app = initializeApp(firebaseConfig);

const uploadImage = async (file, name)=>{

    const storage = getStorage(app);

    const storageRef = ref(storage, name);

    await uploadBytes(storageRef, file);

    return true;
};
const downloadImage = async (url)=>{

    const storage = getStorage(app);

    const pathReference = ref(storage, url);

    return await getDownloadURL(pathReference);
};


export {uploadImage, downloadImage};



