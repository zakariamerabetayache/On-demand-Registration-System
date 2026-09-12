import Swal from "sweetalert2";

const ErrorHandling = (error) => {
  const response = error.response;

  if (!response) {
    Swal.fire({
      title: "خطأ داخلي",
      text: error.message,
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "تم",
    });
    return;
  }

  const errorMessage = response.data?.message || response.data?.error;
  const validationErrors = response.data?.errors;
  const listMessage = response.data?.list;

  // Handle 429 Rate Limiting specifically
  if (response.status === 429) {
    Swal.fire({
      title: "تم تجاوز الحد المسموح",
      text: "تم إرسال طلبات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.",
      icon: "warning",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "تم",
      timer: 3000,
      timerProgressBar: true,
    });
    return;
  }

  // Handle 422 validation errors specifically
  if (response.status === 422 && validationErrors) {
    // Create HTML list of validation errors
    let errorHtml = errorMessage ? `<p style="margin-bottom: 15px; font-weight: bold;">${errorMessage}</p>` : '';
    errorHtml += '<ul style="text-align: right; margin: 0; padding-right: 20px;">';
    
    Object.keys(validationErrors).forEach(field => {
      const fieldErrors = validationErrors[field];
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(error => {
          errorHtml += `<li style="margin-bottom: 5px; color: #d32f2f;">${error}</li>`;
        });
      } else {
        errorHtml += `<li style="margin-bottom: 5px; color: #d32f2f;">${fieldErrors}</li>`;
      }
    });
    
    errorHtml += '</ul>';
    
    Swal.fire({
      title: "خطأ في البيانات المدخلة",
      html: errorHtml,
      icon: "warning",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "تم",
      width: '500px',
      customClass: {
        htmlContainer: 'text-right'
      }
    });
    return;
  }

  // Handle other error types
  if (response) {
    Swal.fire({
      title:
        response.status === 500
          ? "خطأ داخلي"
          : response.status === 401
          ? "خطأ في صلاحية البيانات"
          : response.status === 422
          ? "خطأ في شكل البيانات"
          : "خطأ غير محدد",
      text: errorMessage,
      icon:
        response.status === 500
          ? "error"
          : response.status === 422
          ? "info"
          : response.status === 401
          ? "warning"
          : "info",
      html:
        response.status === 401
          ? errorMessage + "<br>" + JSON.stringify(listMessage)
          : null,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "تم",
    });
  }
};

export default ErrorHandling;
