import  Axios  from "axios";


const axiosClient =Axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,

});

// les terceptors sont des fonctions qui s'executent avant l'execution d'une requete ou apres la reception de la reponse.
axiosClient.interceptors.request.use( (config) => {
    const token=localStorage.getItem('ACCESS_TOKEN');
    config.headers.Authorization=`Bearer ${token}`
    return config;
}
);

axiosClient.interceptors.response.use( (response) => {
    return response;

},(error)=>{
    try {
        const {response}=error;
        if(response.status===401){
            localStorage.removeItem('ACCESS_TOKEN');
        }
        
    } catch (error) {
        console.error(error)
    }
    throw error;
    // return Promise.reject(error);
}
);

export default axiosClient;