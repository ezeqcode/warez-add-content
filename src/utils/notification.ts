import { toast } from "react-toastify"

type notifyMessage = "error" | "success" | "warn" | "info"

const notify = (msg: string, type: notifyMessage = "info") => {
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
      
      default:
        toast.info(msg, {
          autoClose: 2500,
          closeOnClick: true,
        });
    }
  };

  export default notify;