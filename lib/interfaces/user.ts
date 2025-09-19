import type { W2EmployerAddress, W2FederalWagesAndTaxes, W2StateAndLocal } from '@/lib/interfaces/w2';

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  ssnTin: string;
  dateOfBirth: Date;
  phone: string;
  email: string;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  residencyState: string;
}

export interface StudentInfo {
  universityName: string;
}

export interface ProfessionalInfo {
  employmentType: "employed" | "freelancer";
  companyName?: string; // Optional: only present if employed
  freelanceYears?: number; // Optional: only present if freelancer
}

export interface StatusInfo {
  isUSResident: boolean;
  status: "student" | "professional";
  studentInfo?: StudentInfo; // Optional: only present if status is student
  professionalInfo?: ProfessionalInfo; // Optional: only present if status is professional
}

export interface UserW2Data {
  tax_year: number;
  box_b_employer_ein: string;
  box_c_employer_name_address_zip: W2EmployerAddress;
  box_d_control_number?: string | null;
  federal_wages_and_taxes: W2FederalWagesAndTaxes;
  state_and_local: W2StateAndLocal;
}

export interface User {
  _id: string;
  personalInfo: PersonalInfo;
  address: Address;
  statusInfo: StatusInfo;
  w2?: UserW2Data[];
  createdAt: Date;
  updatedAt: Date;
}

// Form submission type (without _id and timestamps)
export type UserFormData = Omit<User, "_id" | "createdAt" | "updatedAt">;
