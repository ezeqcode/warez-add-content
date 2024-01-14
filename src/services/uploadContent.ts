import { AxiosResponse } from "axios";
import notify from "../utils/notification";
import api from "../Api/api";

export async function uploadFile(id: string, file: File, shouldNotify = true): Promise<AxiosResponse> {
    try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("file", file);

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