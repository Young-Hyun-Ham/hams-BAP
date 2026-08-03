import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

// API 기본 URL 설정 - Next.js rewrite를 통해 backend 서비스로 프록시됨
const API_URL = '/api/v1';

// 표준화된 에러 형식 정의
interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// API 클라이언트 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // localStorage 안전하게 접근
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  },
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공적인 응답은 데이터만 반환
    return response.data;
  },
  (error: AxiosError) => {
    // 표준화된 에러 객체 생성
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: 'An unexpected error occurred',
      details: error.response?.data || null,
    };

    // 401 Unauthorized: 토큰 만료 또는 인증 실패
    if (error.response?.status === 401) {
      apiError.message = 'Authentication failed. Please login again.';

      // 브라우저 환경에서만 실행
      if (typeof window !== 'undefined') {
        // 로그아웃 처리 및 로그인 페이지로 리다이렉트
        // // authStore import를 동적으로 처리 (순환 참조 방지)
        // import('@/lib/store/authStore').then(({ useAuthStore }) => {
        //   const { logout } = useAuthStore.getState();
        //   logout();

        //   // 로그인 페이지로 리다이렉트
        //   window.location.href = '/';
        // });
      }
    } else if (axios.isCancel(error)) {
      apiError.message = 'Request canceled';
    } else if (error.code === 'ECONNABORTED') {
      apiError.message = 'Request timed out';
      apiError.status = 408; // Request Timeout
    } else if (error.response) {
      // 서버가 상태 코드로 응답한 경우
      apiError.message = (error.response.data as any)?.detail || error.message;
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      apiError.message =
        'No response from server. Please check your network connection.';
    } else {
      // 요청 설정 중 에러가 발생한 경우
      apiError.message = error.message;
    }

    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  },
);

export default apiClient;

// 파일 업로드와 같이 특수한 설정이 필요한 경우를 위한 별도 인스턴스
export const apiUploadClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 파일 업로드는 타임아웃을 길게 설정 (5분)
});

// 요청 인터셉터 (업로드 클라이언트용)
apiUploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData를 사용하는 경우 Content-Type은 axios가 자동으로 설정하도록 둡니다.
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 응답 인터셉터 (업로드 클라이언트용)
apiUploadClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: (error.response?.data as any)?.detail || 'File upload failed.',
      details: error.response?.data || null,
    };
    console.error('API Upload Error:', apiError);
    return Promise.reject(apiError);
  },
);

/**
 * 비동기 요청 취소를 위한 유틸리티입니다.
 * 컴포넌트가 언마운트될 때 요청을 취소하는 등의 상황에 사용할 수 있습니다.
 *
 * 사용 예시:
 * const cancelTokenSource = getCancelTokenSource();
 *
 * apiClient.get('/some-endpoint', {
 *   cancelToken: cancelTokenSource.token
 * });
 *
 * // 필요할 때 요청 취소
 * cancelTokenSource.cancel('Request canceled by user.');
 */
export const getCancelTokenSource = () => {
  return axios.CancelToken.source();
};
