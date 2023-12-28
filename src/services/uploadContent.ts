import axios, { AxiosResponse } from "axios";
import notify from "../utils/notification";

export async function uploadFile(id: string, file: File): Promise<AxiosResponse> {
    try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("file", file);

        const response = await axios.post("http://149.56.205.234:7070/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        notify("Upload concluído com sucesso!", "success")

        return response;
    } catch (error) {
        // Manipule erros aqui
        notify('Erro ao enviar arquivo', "error")
        
        throw error;
    }
}

// URL 149.56.205.234:7070