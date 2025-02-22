import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_AXIOS_URL,
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})

export default axiosInstance