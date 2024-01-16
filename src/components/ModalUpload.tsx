import React, { useEffect, useState } from "react";
import { Form, Field, ErrorMessage, Formik } from "formik";
import * as Yup from "yup"; // Certifique-se de ter o Yup instalado: npm install yup
import { uploadFile } from "../services/uploadContent";
import { FilePart } from "../utils/IFileParts";
import notify from "../utils/notification";
import { useSearchParams } from "react-router-dom";

interface ModalUploadProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  contentName: string;
  file: File | FilePart[] | null;
}

const ModalUploadSchema = Yup.object().shape({
  id: Yup.string().required("O ID é obrigatório"),
});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ModalUpload: React.FC<ModalUploadProps> = ({
  onClose,
  onUploadSuccess,
  contentName,
  file,
}) => {
  const [searchParams] = useSearchParams();
  const initialValues = { id: "" };
  const [fileParts, setFileParts] = useState<FilePart[]>(
    Array.isArray(file) ? file : []
  );

  const destiny = searchParams.get("destiny");

  console.log(destiny, "desitin modal");
  useEffect(() => {}, [searchParams]);

  const handleCheckboxChange = (index: number) => {
    setFileParts((prevFileParts) => {
      const updatedFileParts = [...prevFileParts];
      updatedFileParts[index] = {
        ...updatedFileParts[index],
        isChecked: !updatedFileParts[index].isChecked,
      };
      return updatedFileParts;
    });
  };

  const onSubmitForm = async (values: typeof initialValues) => {
    try {
      if (!file) return;
      if (!Array.isArray(file)) {
        await uploadFile(values.id, file, destiny || "warez");
        return onUploadSuccess();
      }

      for (let index = 0; index < file.length; index++) {
        const notifyPromise = new Promise(async (resolve, reject) => {
          try {
            const result = await uploadFile(
              values.id,
              file[index].content,
              destiny || "warez",
              false
            );

            console.log(new Date());

            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        await notify(`Parte ${index + 1}`, "promise", notifyPromise);
        if (index !== file.length - 2) {
          notify("Avançando para próxima etapa");
        }
        await delay(3000);
      }
      return onUploadSuccess();
    } catch (error) {
      console.error("Erro ao postar arquivo:", error);
    }
  };

  return (
    <div className="fixed  z-50 top-0  mx-auto w-full h-full flex justify-center items-center bg-white bg-opacity-60  ">
      <div className="p-4 bg-white rounded-lg max-w-[60vw] ">
        <h1 className="text-3xl font-bold mb-2 text-center uppercase">
          {destiny || "warez"}
        </h1>
        <h2 className="text-xl font-bold mb-2">{contentName}</h2>
        {file && !Array.isArray(file) && (
          <div className="mb-4">
            <strong>Nome do Arquivo:</strong> {file.name}
          </div>
        )}

        <Formik
          initialValues={{
            id: "",
          }}
          onSubmit={onSubmitForm}
          validationSchema={ModalUploadSchema}
        >
          {({ isSubmitting }) => (
            <Form>
              {fileParts && fileParts.length > 0 && (
                <div className="flex flex-col gap-2">
                  {/* <p className="font-semibold italic text-red-400 text-center ">
                    Obs: A fragmentação do arquivo é a melhor forma de lidar com
                    essa quantidade de episódios mas ainda pode apresentar
                    conteúdos duplicados
                  </p> */}
                  <span>Selecione quais partes gostaria de fazer upload: </span>
                  <div className="flex gap-3 flex-wrap">
                    {fileParts.map((part, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={part.isChecked}
                          onChange={() => handleCheckboxChange(index)}
                        />
                        <span>
                          <strong>Parte:</strong> {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4 mt-2">
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700"
                >
                  ID do Conteúdo
                </label>
                <Field
                  type="text"
                  id="id"
                  name="id"
                  // onChange={formik.handleChange}
                  //onBlur={formik.handleBlur}
                  //value={formik.values.id}
                  className={`mt-1 p-2 border ${
                    false ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                <ErrorMessage
                  name="id"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Aguarde..." : "Postar Arquivo"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ModalUpload;
