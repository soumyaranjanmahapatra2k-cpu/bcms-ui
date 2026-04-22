export interface User {
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  businessUnitId: string;
  businessUnitName: string;
  roles: string[];
  status: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
