import React from "react";
import { Form, Field, ErrorMessage, Formik } from "formik";
import * as Yup from "yup"; // Certifique-se de ter o Yup instalado: npm install yup
import { uploadFile } from "../services/uploadContent";

interface ModalUploadProps {
  onClose: () => void;
  onUploadSuccess: () => void;
  contentName: string;
  file: File | null;
}

const ModalUploadSchema = Yup.object().shape({
  id: Yup.string().required("O ID é obrigatório"),
});

const ModalUpload: React.FC<ModalUploadProps> = ({
  onClose,
  onUploadSuccess,
  contentName,
  file,
}) => {
  const initialValues = { id: "" };

  const onSubmitForm = async (values: typeof initialValues) => {
    try {
      if (file) {
        await uploadFile(values.id, file);
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Erro ao postar arquivo:", error);
    }
  };

  return (
    <div className="fixed  z-50 top-0  mx-auto w-full h-full flex justify-center items-center bg-white bg-opacity-60">
      <div className="p-4 bg-white rounded-lg">
        <h1 className="text-xl font-bold mb-2">{contentName}</h1>
        {file && (
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
          <Form>
            <div className="mb-4">
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
                // disabled={formik.isSubmitting || !formik.isValid}
              >
                Postar Arquivo
              </button>
            </div>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default ModalUpload;
