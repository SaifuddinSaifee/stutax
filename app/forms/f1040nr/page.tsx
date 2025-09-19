"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import type { FieldPathByValue } from "react-hook-form";
import type { F1040NR, F1040NRFilingStatus } from "@/lib/interfaces/f1040nr";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi, useSession } from "@/hooks/use-session";
import type { UserW2Data } from "@/lib/interfaces/user";
import { toast } from "sonner";

type F1040NRFormValues = F1040NR;

type FilingStatusValue =
  | "single"
  | "married_filing_separately"
  | "qualifying_surviving_spouse"
  | "estate"
  | "trust";

// Strongly-typed field definitions to avoid unsafe casts
const incomeFieldDefs: ReadonlyArray<{
  name: FieldPathByValue<F1040NRFormValues, number | undefined>;
  label: string;
}> = [
  { name: "income.line_1a_wages_w2", label: "1a — Wages (W-2)" },
  {
    name: "income.line_1b_household_employee_wages",
    label: "1b — Household Employee Wages",
  },
  { name: "income.line_1c_tip_income", label: "1c — Tip Income" },
  {
    name: "income.line_1d_medicaid_waiver_payments",
    label: "1d — Medicaid Waiver Payments",
  },
  {
    name: "income.line_1e_dependent_care_benefits",
    label: "1e — Dependent Care Benefits",
  },
  { name: "income.line_1f_adoption_benefits", label: "1f — Adoption Benefits" },
  {
    name: "income.line_1g_wages_from_form_8919",
    label: "1g — Wages from Form 8919",
  },
  {
    name: "income.line_1h_other_earned_income",
    label: "1h — Other Earned Income",
  },
  {
    name: "income.line_1k_treaty_exempt_income",
    label: "1k — Treaty-Exempt Income",
  },
  { name: "income.line_1z_total_wages", label: "1z — Total Wages" },
  {
    name: "income.line_2a_tax_exempt_interest",
    label: "2a — Tax-Exempt Interest",
  },
  { name: "income.line_2b_taxable_interest", label: "2b — Taxable Interest" },
  {
    name: "income.line_3a_qualified_dividends",
    label: "3a — Qualified Dividends",
  },
  {
    name: "income.line_3b_ordinary_dividends",
    label: "3b — Ordinary Dividends",
  },
  { name: "income.line_4a_ira_distributions", label: "4a — IRA Distributions" },
  {
    name: "income.line_4b_taxable_ira_distributions",
    label: "4b — Taxable IRA Distributions",
  },
  {
    name: "income.line_5a_pensions_annuities",
    label: "5a — Pensions/Annuities",
  },
  {
    name: "income.line_5b_taxable_pensions_annuities",
    label: "5b — Taxable Pensions/Annuities",
  },
  { name: "income.line_7_capital_gain_loss", label: "7 — Capital Gain/Loss" },
  {
    name: "income.line_8_other_income_schedule_1",
    label: "8 — Other Income (Schedule 1)",
  },
  {
    name: "income.line_9_total_effectively_connected_income",
    label: "9 — Total Effectively Connected Income",
  },
  {
    name: "income.line_10_adjustments_schedule_1",
    label: "10 — Adjustments (Schedule 1)",
  },
  {
    name: "income.line_11_adjusted_gross_income",
    label: "11 — Adjusted Gross Income",
  },
  {
    name: "income.line_12_itemized_or_standard_deduction",
    label: "12 — Itemized or Standard Deductions",
  },
  {
    name: "income.line_13a_qualified_business_income_deduction",
    label: "13a — Qualified Business Income Deduction",
  },
  {
    name: "income.line_13b_exemptions_estates_trusts",
    label: "13b — Exemptions (Estates/Trusts)",
  },
  { name: "income.line_14_total_deductions", label: "14 — Total Deductions" },
  { name: "income.line_15_taxable_income", label: "15 — Taxable Income" },
] as const;

const taxAndCreditsFieldDefs: ReadonlyArray<{
  name: FieldPathByValue<F1040NRFormValues, number | undefined>;
  label: string;
}> = [
  { name: "tax_and_credits.line_16_tax", label: "16 — Tax" },
  {
    name: "tax_and_credits.line_17_other_taxes_schedule_2",
    label: "17 — Other Taxes (Schedule 2)",
  },
  {
    name: "tax_and_credits.line_18_total_tax_before_credits",
    label: "18 — Total Tax Before Credits",
  },
  {
    name: "tax_and_credits.line_19_child_tax_credit_other_dependents",
    label: "19 — Child Tax Credit/Other Dependents",
  },
  {
    name: "tax_and_credits.line_20_other_credits_schedule_3",
    label: "20 — Other Credits (Schedule 3)",
  },
  {
    name: "tax_and_credits.line_21_total_credits",
    label: "21 — Total Credits",
  },
  {
    name: "tax_and_credits.line_22_tax_after_credits",
    label: "22 — Tax After Credits",
  },
  {
    name: "tax_and_credits.line_23a_tax_on_nec_income",
    label: "23a — Tax on NEC Income",
  },
  { name: "tax_and_credits.line_23b_other_taxes", label: "23b — Other Taxes" },
  {
    name: "tax_and_credits.line_23c_transportation_tax",
    label: "23c — Transportation Tax",
  },
  { name: "tax_and_credits.line_24_total_tax", label: "24 — Total Tax" },
] as const;

const paymentsFieldDefs: ReadonlyArray<{
  name: FieldPathByValue<F1040NRFormValues, number | undefined>;
  label: string;
}> = [
  {
    name: "payments.line_25a_federal_tax_withheld_w2",
    label: "25a — Federal Tax Withheld (W-2)",
  },
  {
    name: "payments.line_25b_federal_tax_withheld_1099",
    label: "25b — Federal Tax Withheld (1099)",
  },
  {
    name: "payments.line_25c_other_federal_withholding",
    label: "25c — Other Federal Withholding",
  },
  {
    name: "payments.line_25d_subtotal_withholding",
    label: "25d — Subtotal Withholding",
  },
  {
    name: "payments.line_25e_form_8805_withholding",
    label: "25e — Form 8805 Withholding",
  },
  {
    name: "payments.line_25f_form_8288a_withholding",
    label: "25f — Form 8288-A Withholding",
  },
  {
    name: "payments.line_25g_form_1042s_withholding",
    label: "25g — Form 1042-S Withholding",
  },
  {
    name: "payments.line_26_estimated_tax_payments",
    label: "26 — Estimated Tax Payments",
  },
  {
    name: "payments.line_28_additional_child_tax_credit",
    label: "28 — Additional Child Tax Credit",
  },
  {
    name: "payments.line_29_payment_with_form_1040c",
    label: "29 — Payment with Form 1040-C",
  },
  {
    name: "payments.line_31_other_payments_schedule_3",
    label: "31 — Other Payments (Schedule 3)",
  },
  { name: "payments.line_33_total_payments", label: "33 — Total Payments" },
] as const;

const refundNumericFieldDefs: ReadonlyArray<{
  name: FieldPathByValue<F1040NRFormValues, number | undefined>;
  label: string;
}> = [
  { name: "refund.line_34_overpayment", label: "34 — Overpayment" },
  { name: "refund.line_35a_refund_amount", label: "35a — Refund Amount" },
  {
    name: "refund.line_36_apply_to_next_year",
    label: "36 — Apply to Next Year",
  },
] as const;

const amountYouOweFieldDefs: ReadonlyArray<{
  name: FieldPathByValue<F1040NRFormValues, number | undefined>;
  label: string;
}> = [
  {
    name: "amount_you_owe.line_37_amount_you_owe",
    label: "37 — Amount You Owe",
  },
  {
    name: "amount_you_owe.line_38_estimated_tax_penalty",
    label: "38 — Estimated Tax Penalty",
  },
] as const;

export default function F1040NRForm() {
  const api = useApi();
  const { ready, email } = useSession();
  const didAutofillRef = useRef(false);
  const initialValues: F1040NRFormValues = {
    tax_year: new Date().getFullYear(),
    header: {
      tax_year_begin: "",
      tax_year_end: "",
      first_name_and_middle_initial: "",
      last_name: "",
      identifying_number: "",
      us_address: "",
      foreign_address: "",
    },
    filing_status: {
      single: true,
      married_filing_separately: false,
      qualifying_surviving_spouse: false,
      estate: false,
      trust: false,
      childs_name_if_qss: "",
    },
    digital_assets: { digital_asset_activity: false },
    dependents: { dependents: [] },
    income: {},
    tax_and_credits: {},
    payments: {},
    refund: {},
    amount_you_owe: {},
    third_party_designee: {
      allow_discussion_with_irs: false,
      designee_name: "",
      phone_number: "",
      pin: "",
    },
    sign_here: {
      signature: "",
      date: new Date().toISOString().split("T")[0],
      occupation: "",
      identity_protection_pin: "",
      phone_number: "",
      email_address: "",
    },
  };

  const form = useForm<F1040NRFormValues>({
    defaultValues: initialValues,
  });

  type ApiUser = {
    personalInfo?: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      suffix?: string;
      ssnTin?: string;
      phone?: string;
      email?: string;
    };
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    w2?: UserW2Data[];
  };

  const toMiddleInitial = useCallback((value?: string): string => {
    const v = (value || "").trim();
    if (!v) return "";
    const first = v.replace(/\./g, "").charAt(0);
    return first ? first.toUpperCase() : "";
  }, []);

  const formatUSAddress = useCallback((addr?: ApiUser["address"]): string => {
    if (!addr) return "";
    const line1 = addr.addressLine1 || "";
    const line2 = addr.addressLine2 ? `, ${addr.addressLine2}` : "";
    const city = addr.city ? `, ${addr.city}` : "";
    const stateZip = addr.state || addr.zip ? `, ${addr.state || ""} ${addr.zip || ""}` : "";
    return `${line1}${line2}${city}${stateZip}`.trim();
  }, []);

  const sum = (values: Array<number | undefined | null>): number =>
    values.reduce<number>((acc: number, v) => acc + (typeof v === "number" && !Number.isNaN(v) ? v : 0), 0);

  const autofillFromProfileAndW2 = useCallback(async () => {
    try {
      const res = await api('/api/users');
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Failed to load user');
      }
      const user = (await res.json()) as ApiUser;
      let taxYear = form.getValues('tax_year');
      const allW2s = Array.isArray(user.w2) ? user.w2 : [];
      let w2s = allW2s.filter((w) => w.tax_year === taxYear);
      if (w2s.length === 0 && allW2s.length > 0) {
        // Fallback: use the latest available W-2 year and update form tax year
        const latestYear = allW2s.map((w) => w.tax_year).reduce((a, b) => Math.max(a, b), 0);
        w2s = allW2s.filter((w) => w.tax_year === latestYear);
        taxYear = latestYear;
        form.setValue('tax_year', latestYear);
        toast.message(`No W-2 for ${form.getValues('tax_year')}. Using ${latestYear} instead.`);
      }
      if (w2s.length === 0) {
        toast.info('No W-2 data found to autofill.');
        return;
      }

      const wages1a = sum(w2s.map((w) => w.federal_wages_and_taxes.box_1_wages_tips_other_comp));
      const tips1c = sum(w2s.map((w) => w.federal_wages_and_taxes.box_7_social_security_tips));
      const depCare1e = sum(w2s.map((w) => w.federal_wages_and_taxes.box_10_dependent_care_benefits));
      const otherEarned1h = sum(w2s.map((w) => w.federal_wages_and_taxes.box_8_allocated_tips));
      const sched1Line8 = sum(w2s.map((w) => w.federal_wages_and_taxes.box_11_nonqualified_plans));
      const withheld25a = sum(w2s.map((w) => w.federal_wages_and_taxes.box_2_federal_income_tax_withheld));

      // Header
      form.setValue('header.first_name_and_middle_initial', `${user.personalInfo?.firstName || ''} ${toMiddleInitial(user.personalInfo?.middleName)}`.trim());
      form.setValue('header.last_name', user.personalInfo?.lastName || '');
      form.setValue('header.identifying_number', user.personalInfo?.ssnTin || '');
      form.setValue('header.us_address', formatUSAddress(user.address));

      // Payments
      form.setValue('payments.line_25a_federal_tax_withheld_w2', withheld25a || undefined);

      // Income
      form.setValue('income.line_1a_wages_w2', wages1a || undefined);
      if (tips1c) form.setValue('income.line_1c_tip_income', tips1c);
      if (depCare1e) form.setValue('income.line_1e_dependent_care_benefits', depCare1e);
      if (otherEarned1h) form.setValue('income.line_1h_other_earned_income', otherEarned1h);
      if (sched1Line8) form.setValue('income.line_8_other_income_schedule_1', sched1Line8);

      // 1z total of 1a–1h (only summing what we filled plus any existing)
      const oneB = form.getValues('income.line_1b_household_employee_wages') || 0;
      const oneD = form.getValues('income.line_1d_medicaid_waiver_payments') || 0;
      const oneF = form.getValues('income.line_1f_adoption_benefits') || 0;
      const oneG = form.getValues('income.line_1g_wages_from_form_8919') || 0;
      const oneA = wages1a || 0;
      const oneC = tips1c || 0;
      const oneE = depCare1e || 0;
      const oneH = otherEarned1h || 0;
      const oneZ = oneA + oneB + oneC + oneD + oneE + oneF + oneG + oneH;
      if (oneZ) form.setValue('income.line_1z_total_wages', Math.round(oneZ * 100) / 100);

      // Convenience: fill sign_here contact fields
      if (user.personalInfo?.phone) form.setValue('sign_here.phone_number', user.personalInfo.phone);
      if (user.personalInfo?.email) form.setValue('sign_here.email_address', user.personalInfo.email);

      toast.success('Autofilled from Profile & W‑2');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Autofill failed';
      toast.error(message);
    }
  }, [api, form, formatUSAddress, toMiddleInitial]);

  useEffect(() => {
    if (!ready || !email) return;
    if (didAutofillRef.current) return;
    didAutofillRef.current = true;
    void autofillFromProfileAndW2();
  }, [ready, email, autofillFromProfileAndW2]);

  const {
    fields: dependentFields,
    append: appendDependent,
    remove: removeDependent,
  } = useFieldArray({
    control: form.control,
    name: "dependents.dependents",
  });

  const filing_status =
    form.watch("filing_status") || ({} as F1040NRFilingStatus);
  const filingStatusValue: FilingStatusValue =
    filing_status.qualifying_surviving_spouse
      ? "qualifying_surviving_spouse"
      : filing_status.married_filing_separately
      ? "married_filing_separately"
      : filing_status.estate
      ? "estate"
      : filing_status.trust
      ? "trust"
      : "single";

  function setFilingStatus(status: FilingStatusValue) {
    form.setValue("filing_status.single", status === "single");
    form.setValue(
      "filing_status.married_filing_separately",
      status === "married_filing_separately"
    );
    form.setValue(
      "filing_status.qualifying_surviving_spouse",
      status === "qualifying_surviving_spouse"
    );
    form.setValue("filing_status.estate", status === "estate");
    form.setValue("filing_status.trust", status === "trust");
  }

  const onSubmit: SubmitHandler<F1040NRFormValues> = (values) => {
    console.log(values);
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-center">
              Form 1040-NR — U.S. Nonresident Alien Income Tax Return
            </CardTitle>
            <Button type="button" variant="secondary" onClick={autofillFromProfileAndW2}>
              Autofill from Profile & W‑2
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Header */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Header / Identifying Information
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tax_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div />
                  <FormField
                    control={form.control}
                    name="header.tax_year_begin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Year Begin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="header.tax_year_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Year End</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="header.first_name_and_middle_initial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name and Middle Initial</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First name and middle initial"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="header.last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="header.identifying_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identifying Number (SSN/ITIN)</FormLabel>
                      <FormControl>
                        <Input placeholder="SSN/ITIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="header.us_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>U.S. Address</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Street, City, State, ZIP"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="header.foreign_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foreign Address</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Country, Province/State, Postal Code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Filing Status */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Filing Status</h2>
                <RadioGroup
                  value={filingStatusValue}
                  onValueChange={setFilingStatus}
                  className="grid gap-3 md:grid-cols-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="status-single" />
                    <label htmlFor="status-single" className="text-sm">
                      Single
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="married_filing_separately"
                      id="status-mfs"
                    />
                    <label htmlFor="status-mfs" className="text-sm">
                      Married Filing Separately
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="qualifying_surviving_spouse"
                      id="status-qss"
                    />
                    <label htmlFor="status-qss" className="text-sm">
                      Qualifying Surviving Spouse
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="estate" id="status-estate" />
                    <label htmlFor="status-estate" className="text-sm">
                      Estate
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trust" id="status-trust" />
                    <label htmlFor="status-trust" className="text-sm">
                      Trust
                    </label>
                  </div>
                </RadioGroup>
                {form.watch("filing_status.qualifying_surviving_spouse") && (
                  <FormField
                    control={form.control}
                    name="filing_status.childs_name_if_qss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child’s Name (if QSS)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter qualifying child’s name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator className="my-6" />

              {/* Digital Assets */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Digital Assets</h2>
                <FormField
                  control={form.control}
                  name="digital_assets.digital_asset_activity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>
                        At any time during the tax year, did you receive, sell,
                        exchange, or otherwise dispose of a digital asset?
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Dependents */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Dependents</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendDependent({
                        dependent_name: "",
                        dependent_id: "",
                        relationship: "",
                        child_tax_credit_eligible: false,
                        other_dependent_credit_eligible: false,
                      })
                    }
                  >
                    Add Dependent
                  </Button>
                </div>
                <div className="grid gap-4">
                  {dependentFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`dependents.dependents.${index}.dependent_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dependent Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`dependents.dependents.${index}.dependent_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dependent ID (SSN/ITIN)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`dependents.dependents.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`dependents.dependents.${index}.child_tax_credit_eligible`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>Child Tax Credit Eligible</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`dependents.dependents.${index}.other_dependent_credit_eligible`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Other Dependent Credit Eligible
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDependent(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Income */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Income — Effectively Connected With U.S. Trade or Business
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {incomeFieldDefs.map((def) => (
                    <FormField
                      key={def.name}
                      control={form.control}
                      name={def.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Tax and Credits */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Tax and Credits</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {taxAndCreditsFieldDefs.map((def) => (
                    <FormField
                      key={def.name}
                      control={form.control}
                      name={def.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payments */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Payments</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentsFieldDefs.map((def) => (
                    <FormField
                      key={def.name}
                      control={form.control}
                      name={def.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Refund */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Refund</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {refundNumericFieldDefs.map((def) => (
                    <FormField
                      key={def.name}
                      control={form.control}
                      name={def.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="refund.line_35b_routing_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>35b — Routing Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Routing number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refund.line_35c_account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>35c — Account Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refund.line_35d_account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>35d — Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refund.line_35e_foreign_refund_mailing_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          35e — Foreign Refund Mailing Address
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Foreign mailing address (if different)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Amount You Owe */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Amount You Owe</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {amountYouOweFieldDefs.map((def) => (
                    <FormField
                      key={def.name}
                      control={form.control}
                      name={def.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseFloat(e.target.value || "0")
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Third Party Designee */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Third Party Designee</h2>
                <FormField
                  control={form.control}
                  name="third_party_designee.allow_discussion_with_irs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>
                        Allow another person to discuss this return with the
                        IRS?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch(
                  "third_party_designee.allow_discussion_with_irs"
                ) && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="third_party_designee.designee_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designee Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="third_party_designee.phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="third_party_designee.pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Sign Here */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Sign Here</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sign_here.signature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={`${form.getValues(
                              "header.first_name_and_middle_initial"
                            )} ${form.getValues("header.last_name")}`.trim()}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sign_here.date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="sign_here.occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sign_here.identity_protection_pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identity Protection PIN</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sign_here.phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sign_here.email_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit">Submit Form 1040-NR</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
