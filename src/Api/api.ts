import axios, { AxiosResponse } from 'axios';


const api = axios.create({
    baseURL: "http://149.56.205.234:7070",
});

interface RequestCooldown {
    [key: string]: boolean;
}

interface CooldownError extends Error {
    isCooldownError?: boolean;
  }

const requestCooldowns: RequestCooldown = {};

const checkCooldownAndReject = (method: string, url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const key = `${method}_${url}`;
        console.log(key, requestCooldowns[key])
        if (requestCooldowns[key]) {
            const cooldownError: CooldownError = new Error('Por favor, aguarde antes de fazer outra solicitação para esta ação');
            cooldownError.isCooldownError = true;
            reject(cooldownError);
        } else {
            resolve();
            requestCooldowns[key] = true;
        }
    });
};

api.interceptors.request.use(async (config) => {
    const { method, url } = config;

    if (method && url) {
        try {
            await checkCooldownAndReject(method.toLowerCase(), url);
        } catch (error) {
            throw error;
        }
    }

    return config;
});

api.interceptors.response.use(
    (response: AxiosResponse) => {
        const key = `${response.config.method?.toLowerCase()}_${response.config.url}`;
        requestCooldowns[key] = false;
        return response;
    },
    (error) => {
        const key = `${error?.config?.method?.toLowerCase()}_${error?.config?.url}`;
        requestCooldowns[key] = false;

        if (error.isCooldownError) {
            error.isInterceptorError = true;
          }
        return Promise.reject(error);
    }
);

export default api;
