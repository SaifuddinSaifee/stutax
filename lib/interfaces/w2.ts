export interface W2EmployerAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string; // 2 characters
  zip: string;
}

export interface W2EmployeeName {
  first: string;
  middle_initial?: string | null;
  last: string;
  suffix?: string | null;
}

export interface W2EmployeeAddress {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string; // 2 characters
  zip: string;
}

export interface W2IdentificationAndAddress {
  box_a_employee_ssn: string; // Format: XXX-XX-XXXX
  box_b_employer_ein: string; // Format: XX-XXXXXXX
  box_c_employer_name_address_zip: W2EmployerAddress;
  box_d_control_number?: string | null;
  box_e_employee_name: W2EmployeeName;
  box_f_employee_address_zip: W2EmployeeAddress;
}

export interface W2Box12Item {
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'M' | 'N' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'V' | 'W' | 'Y' | 'Z' | 'AA' | 'BB' | 'DD' | 'EE' | 'FF' | 'GG' | 'HH' | 'II';
  amount: number;
}

export interface W2Box13Checkboxes {
  statutory_employee: boolean;
  retirement_plan: boolean;
  third_party_sick_pay: boolean;
}

export interface W2Box14Item {
  label: string;
  amount: number;
}

export interface W2FederalWagesAndTaxes {
  box_1_wages_tips_other_comp: number;
  box_2_federal_income_tax_withheld: number;
  box_3_social_security_wages: number;
  box_4_social_security_tax_withheld: number;
  box_5_medicare_wages_and_tips: number;
  box_6_medicare_tax_withheld: number;
  box_7_social_security_tips: number;
  box_8_allocated_tips: number;
  box_9_reserved?: string | null;
  box_10_dependant_care_benefits: number;
  box_11_nonqualified_plans: number;
  box_12_items: W2Box12Item[];
  box_13_checkboxes: W2Box13Checkboxes;
  box_14_other: W2Box14Item[];
}

export interface W2LocalEntry {
  box_20_locality_name: string;
  box_18_local_wages?: number;
  box_19_local_income_tax?: number;
}

export interface W2StateEntry {
  box_15_state: string; // 2 characters
  box_15_employer_state_id: string;
  box_16_state_wages: number;
  box_17_state_income_tax: number;
  locals?: W2LocalEntry[];
}

export interface W2StateAndLocal {
  entries: W2StateEntry[];
}

export interface W2CopiesMetadata {
  copy?: 'Copy A' | 'Copy 1' | 'Copy B' | 'Copy C' | 'Copy 2' | 'Copy D';
  void_indicator?: boolean;
}

export interface W2 {
  tax_year: number;
  identification_and_address: W2IdentificationAndAddress;
  federal_wages_and_taxes: W2FederalWagesAndTaxes;
  state_and_local: W2StateAndLocal;
  copies_metadata?: W2CopiesMetadata;
}
