export interface PersonalInfo {
  name: string;
  ssnTin: string;
  dateOfBirth: Date;
  phone: string;
  email: string;
}

export interface Address {
  street: string;
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

export interface User {
  _id: string;
  personalInfo: PersonalInfo;
  address: Address;
  statusInfo: StatusInfo;
  createdAt: Date;
  updatedAt: Date;
}

// Form submission type (without _id and timestamps)
export type UserFormData = Omit<User, "_id" | "createdAt" | "updatedAt">;
