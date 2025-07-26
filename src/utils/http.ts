import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

class HttpClient {
  private client: AxiosInstance;
  private publicClient: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '';
    
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.publicClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      try {
        const authSession = await fetchAuthSession({ forceRefresh: true });
        config.headers.Authorization = authSession.tokens?.idToken?.toString();
        localStorage.setItem('cognitoIdToken', config?.headers?.Authorization!);
        return config;
      } catch (error) {
        return Promise.reject(error);
      }
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(`${this.baseURL}${url}`, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(`${this.baseURL}${url}`, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(`${this.baseURL}${url}`, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(`${this.baseURL}${url}`, config);
    return response.data;
  }

  async publicGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.publicClient.get(`${this.baseURL}${url}`, config);
    return response.data;
  }

  async publicPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.publicClient.post(`${this.baseURL}${url}`, data, config);
    return response.data;
  }

  async publicPut<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.publicClient.put(`${this.baseURL}${url}`, data, config);
    return response.data;
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = token;
  }

  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export const http = new HttpClient();
export default HttpClient;
