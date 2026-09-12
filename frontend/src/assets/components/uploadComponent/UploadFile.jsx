import { useReducer } from "react";
import axiosClient from "../../../axios-client";
import ErrorHandling from "../../components/ErrorHandling";
import { UploadOutlined } from "@ant-design/icons";
import { Upload, Button } from "antd";
import { useLanguage } from "../../locale/LanguageContext";
import Swal from "sweetalert2";


function reducer(state,action){
    switch(action.type){
        case "loading":
            return {...state,loading:action.payload}
        default:
            return state
    }
}
export default function UploadFile({text,id,buttonStyle,accept,modal ,storage ,changeState}) {
    const {translate} = useLanguage()
    const initialState = {
        loading:false,
    }
    const [state,dispatch] =useReducer(reducer,initialState)
  

    const handleFileUpload = async (file) => {
        dispatch({type:"loading" ,payload:true})
        const formData = new FormData();
        formData.append("pdf", file);  
        formData.append("modal", modal);  
        formData.append("storage", storage);  

        try {
            const response = await axiosClient.post(`/upload-file/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
          
            if(response && response.data && response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: translate('file_uploaded_successfully') || 'تم رفع الملف بنجاح',
                    showConfirmButton: false,
                    timer: 3500
                });
                
                if(changeState) {
                    changeState(response.data);
                }
            } else {
                throw new Error(response.data?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            ErrorHandling(error);
            
            Swal.fire({
                icon: 'error',
                title: translate('upload_failed') || 'فشل في رفع الملف',
                text: error.response?.data?.message || error.message || translate('please_try_again') || 'يرجى المحاولة مرة أخرى',
                showConfirmButton: true
            });
        }
        finally{
            dispatch({type:"loading" ,payload:false})
        }
        
        // Return false to prevent Ant Design's default upload behavior
        return false;
    }
    return (
      <Upload
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  accept={accept}
                >
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    size="large"
                    loading={state.loading}
                    style={buttonStyle}
                     

                  >
                    {translate(text) || "Upload File"}
                  </Button>
                </Upload>

    );
}