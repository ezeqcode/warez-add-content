import { AxiosResponse } from "axios";
import notify from "../utils/notification";
import apiWarez from "../Api/apiWarez";
import apiTvs from "../Api/apiTvs";

export async function uploadFile(id: string, file: File, destiny: string = "warez", shouldNotify = true): Promise<AxiosResponse> {
    try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("file", file);

        const api = destiny === 'warez' ? apiWarez : apiTvs;

        
        const response = await api.post("upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (shouldNotify) {
            notify("Upload concluído com sucesso!", "success")
        }

        return response;
    } catch (error: any) {
        console.log(error.response.data)
        notify(error.response.data.message || 'Erro ao enviar arquivo', "error")

        throw error;
    }
}

// URL 149.56.205.234:7070