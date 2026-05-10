// ============================================
// ORGANIZATION SERVICE - API LAYER
// ============================================

import axiosInstance from '@/shared/api/axiosInstance';
import { AxiosError } from 'axios';

export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateOrganizationDTO {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  code?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================
// ORGANIZATION API SERVICE
// ============================================

class OrganizationService {
  private baseUrl = '/api/organizations';

  /**
   * Fetch paginated organizations
   */
  async getOrganizations(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<Organization>>> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Organization>>>(
        this.baseUrl,
        {
          params: {
            page,
            pageSize,
            search,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch single organization by ID
   */
  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await axiosInstance.get<ApiResponse<Organization>>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new organization
   */
  async createOrganization(
    data: CreateOrganizationDTO
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await axiosInstance.post<ApiResponse<Organization>>(
        this.baseUrl,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: UpdateOrganizationDTO
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await axiosInstance.put<ApiResponse<Organization>>(
        `${this.baseUrl}/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Soft delete organization
   */
  async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Hard delete organization (Super Admin only)
   */
  async hardDeleteOrganization(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        `${this.baseUrl}/${id}/hard`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Restore organization from trash
   */
  async restoreOrganization(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Organization>>(
        `${this.baseUrl}/${id}/restore`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get trashed organizations
   */
  async getTrashedOrganizations(
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Organization>>> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<PaginatedResponse<Organization>>
      >(`${this.baseUrl}/trash`, {
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data?.message ||
        error.response?.statusText ||
        'An error occurred';
      const err = new Error(message);
      err.cause = error;
      return err;
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Unknown error occurred');
  }
}

export const organizationService = new OrganizationService();
