export interface F1040NRHeader {
  /** ISO date string YYYY-MM-DD */
  tax_year_begin?: string;
  /** ISO date string YYYY-MM-DD */
  tax_year_end?: string;
  first_name_and_middle_initial?: string;
  last_name?: string;
  identifying_number?: string; // SSN/ITIN/EIN as provided on the form
  us_address?: string;
  foreign_address?: string;
}

export interface F1040NRFilingStatus {
  single?: boolean;
  married_filing_separately?: boolean;
  qualifying_surviving_spouse?: boolean;
  estate?: boolean;
  trust?: boolean;
  childs_name_if_qss?: string;
}

export interface F1040NRDigitalAssets {
  digital_asset_activity?: boolean; // Yes/No
}

export interface F1040NRDependent {
  dependent_name?: string;
  dependent_id?: string; // SSN/ITIN
  relationship?: string;
  child_tax_credit_eligible?: boolean;
  other_dependent_credit_eligible?: boolean;
}

export interface F1040NRDependents {
  dependents?: F1040NRDependent[];
}

export interface F1040NRIncome {
  line_1a_wages_w2?: number;
  line_1b_household_employee_wages?: number;
  line_1c_tip_income?: number;
  line_1d_medicaid_waiver_payments?: number;
  line_1e_dependent_care_benefits?: number;
  line_1f_adoption_benefits?: number;
  line_1g_wages_from_form_8919?: number;
  line_1h_other_earned_income?: number;
  line_1k_treaty_exempt_income?: number;
  line_1z_total_wages?: number;
  line_2a_tax_exempt_interest?: number;
  line_2b_taxable_interest?: number;
  line_3a_qualified_dividends?: number;
  line_3b_ordinary_dividends?: number;
  line_4a_ira_distributions?: number;
  line_4b_taxable_ira_distributions?: number;
  line_5a_pensions_annuities?: number;
  line_5b_taxable_pensions_annuities?: number;
  line_7_capital_gain_loss?: number;
  line_8_other_income_schedule_1?: number;
  line_9_total_effectively_connected_income?: number;
  line_10_adjustments_schedule_1?: number;
  line_11_adjusted_gross_income?: number;
  line_12_itemized_or_standard_deduction?: number;
  line_13a_qualified_business_income_deduction?: number;
  line_13b_exemptions_estates_trusts?: number;
  line_14_total_deductions?: number;
  line_15_taxable_income?: number;
}

export interface F1040NRTaxAndCredits {
  line_16_tax?: number;
  line_17_other_taxes_schedule_2?: number;
  line_18_total_tax_before_credits?: number;
  line_19_child_tax_credit_other_dependents?: number;
  line_20_other_credits_schedule_3?: number;
  line_21_total_credits?: number;
  line_22_tax_after_credits?: number;
  line_23a_tax_on_nec_income?: number;
  line_23b_other_taxes?: number;
  line_23c_transportation_tax?: number;
  line_24_total_tax?: number;
}

export interface F1040NRPayments {
  line_25a_federal_tax_withheld_w2?: number;
  line_25b_federal_tax_withheld_1099?: number;
  line_25c_other_federal_withholding?: number;
  line_25d_subtotal_withholding?: number;
  line_25e_form_8805_withholding?: number;
  line_25f_form_8288a_withholding?: number;
  line_25g_form_1042s_withholding?: number;
  line_26_estimated_tax_payments?: number;
  line_28_additional_child_tax_credit?: number;
  line_29_payment_with_form_1040c?: number;
  line_31_other_payments_schedule_3?: number;
  line_33_total_payments?: number;
}

export type F1040NRRefundAccountType = 'checking' | 'savings' | 'other';

export interface F1040NRRefund {
  line_34_overpayment?: number;
  line_35a_refund_amount?: number;
  line_35b_routing_number?: string;
  line_35c_account_type?: F1040NRRefundAccountType;
  line_35d_account_number?: string;
  line_35e_foreign_refund_mailing_address?: string;
  line_36_apply_to_next_year?: number;
}

export interface F1040NRAmountYouOwe {
  line_37_amount_you_owe?: number;
  line_38_estimated_tax_penalty?: number;
}

export interface F1040NRThirdPartyDesignee {
  allow_discussion_with_irs?: boolean;
  designee_name?: string;
  phone_number?: string;
  pin?: string;
}

export interface F1040NRSignHere {
  /** Representation of signature (e.g., data URL or storage key) */
  signature?: string;
  /** ISO date string YYYY-MM-DD */
  date?: string;
  occupation?: string;
  identity_protection_pin?: string;
  phone_number?: string;
  email_address?: string;
}

export interface F1040NR {
  tax_year: number;
  header?: F1040NRHeader;
  filing_status?: F1040NRFilingStatus;
  digital_assets?: F1040NRDigitalAssets;
  dependents?: F1040NRDependents;
  income?: F1040NRIncome;
  tax_and_credits?: F1040NRTaxAndCredits;
  payments?: F1040NRPayments;
  refund?: F1040NRRefund;
  amount_you_owe?: F1040NRAmountYouOwe;
  third_party_designee?: F1040NRThirdPartyDesignee;
  sign_here?: F1040NRSignHere;
}


