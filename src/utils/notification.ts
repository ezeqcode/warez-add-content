import { toast } from "react-toastify";

const notify = (
  msg: string,
  type: "success" | "warn" | "error" | "info" | "promise" = "info",
  promise: Promise<any> | null = null
) => {
  switch (type) {
    case "error":
      toast.error(msg, {
        autoClose: 2500,
        closeOnClick: true,
      });
      break;
    case "success":
      toast.success(msg, {
        autoClose: 2500,
        closeOnClick: true,
      });
      break;
    case "warn":
      toast.warn(msg, {
        autoClose: 2500,
        closeOnClick: true,
      });
      break;
    case "promise":
      if (!promise) return;
      return toast.promise(
        promise,
        {
          error: `Houve um erro ao processar a solicitação (${msg}). Por favor, tente novamente!`,
          success: `${msg} processada com sucesso! `,
          pending: `Processando a solicitação (${msg})...`,
        }
      );
      

    default:
      toast.info(msg, {
        autoClose: 2500,
        closeOnClick: true,
      });
  }
};

export default notify;
