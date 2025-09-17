import { NextResponse } from "next/server";
import { analyzeW2Image } from "@/gemini";
import { extractJsonObject } from "@/utils/parser";
import type { W2 } from "@/lib/interfaces/w2";

function stringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function numberOrZero(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function booleanOrFalse(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return false;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const aiText = await analyzeW2Image(file as File);
    const raw = extractJsonObject<W2>(aiText);

    const id = raw?.identification_and_address ?? ({} as W2["identification_and_address"]);
    const employer = id?.box_c_employer_name_address_zip ?? ({} as W2["identification_and_address"]["box_c_employer_name_address_zip"]);
    const employeeAddr = id?.box_f_employee_address_zip ?? ({} as W2["identification_and_address"]["box_f_employee_address_zip"]);
    const employeeName = id?.box_e_employee_name ?? ({} as W2["identification_and_address"]["box_e_employee_name"]);
    const fed = raw?.federal_wages_and_taxes ?? ({} as W2["federal_wages_and_taxes"]);
    const box12: W2["federal_wages_and_taxes"]["box_12_items"] = Array.isArray(fed?.box_12_items) ? (fed.box_12_items as W2["federal_wages_and_taxes"]["box_12_items"]) : [];
    const box14: W2["federal_wages_and_taxes"]["box_14_other"] = Array.isArray(fed?.box_14_other) ? (fed.box_14_other as W2["federal_wages_and_taxes"]["box_14_other"]) : [];
    const entries: W2["state_and_local"]["entries"] = Array.isArray(raw?.state_and_local?.entries) ? (raw.state_and_local.entries as W2["state_and_local"]["entries"]) : [];

    const payload = {
      tax_year: numberOrZero(raw?.tax_year) || new Date().getFullYear(),
      box_a_employee_ssn: stringOrEmpty(id?.box_a_employee_ssn),
      box_b_employer_ein: stringOrEmpty(id?.box_b_employer_ein),
      box_c_employer_name_address_zip: {
        name: stringOrEmpty(employer?.name),
        address_line1: stringOrEmpty(employer?.address_line1),
        address_line2: stringOrEmpty(employer?.address_line2),
        city: stringOrEmpty(employer?.city),
        state: stringOrEmpty(employer?.state),
        zip: stringOrEmpty(employer?.zip),
      },
      box_d_control_number: stringOrEmpty(id?.box_d_control_number),
      box_e_employee_name: {
        first: stringOrEmpty(employeeName?.first),
        middle_initial: stringOrEmpty(employeeName?.middle_initial),
        last: stringOrEmpty(employeeName?.last),
        suffix: stringOrEmpty(employeeName?.suffix),
      },
      box_f_employee_address_zip: {
        address_line1: stringOrEmpty(employeeAddr?.address_line1),
        address_line2: stringOrEmpty(employeeAddr?.address_line2),
        city: stringOrEmpty(employeeAddr?.city),
        state: stringOrEmpty(employeeAddr?.state),
        zip: stringOrEmpty(employeeAddr?.zip),
      },
      federal_wages_and_taxes: {
        box_1_wages_tips_other_comp: numberOrZero(fed?.box_1_wages_tips_other_comp),
        box_2_federal_income_tax_withheld: numberOrZero(fed?.box_2_federal_income_tax_withheld),
        box_3_social_security_wages: numberOrZero(fed?.box_3_social_security_wages),
        box_4_social_security_tax_withheld: numberOrZero(fed?.box_4_social_security_tax_withheld),
        box_5_medicare_wages_and_tips: numberOrZero(fed?.box_5_medicare_wages_and_tips),
        box_6_medicare_tax_withheld: numberOrZero(fed?.box_6_medicare_tax_withheld),
        box_7_social_security_tips: numberOrZero(fed?.box_7_social_security_tips),
        box_8_allocated_tips: numberOrZero(fed?.box_8_allocated_tips),
        box_10_dependent_care_benefits: numberOrZero(fed?.box_10_dependent_care_benefits),
        box_11_nonqualified_plans: numberOrZero(fed?.box_11_nonqualified_plans),
        box_12_items: box12
          .filter((x) => x && x.code)
          .slice(0, 4)
          .map((x) => ({
            code: String(x.code) as W2["federal_wages_and_taxes"]["box_12_items"][number]["code"],
            amount: numberOrZero((x as { amount?: number | string | null }).amount),
          })),
        box_13_checkboxes: {
          statutory_employee: booleanOrFalse(fed?.box_13_checkboxes?.statutory_employee),
          retirement_plan: booleanOrFalse(fed?.box_13_checkboxes?.retirement_plan),
          third_party_sick_pay: booleanOrFalse(fed?.box_13_checkboxes?.third_party_sick_pay),
        },
        box_14_other: box14
          .filter((x) => x && (x.label || x.amount))
          .map((x) => ({
            label: stringOrEmpty(x.label),
            amount: numberOrZero(x.amount),
          })),
      },
      state_and_local: {
        entries: entries.map((e) => ({
          box_15_state: stringOrEmpty(e?.box_15_state),
          box_15_employer_state_id: stringOrEmpty(e?.box_15_employer_state_id),
          box_16_state_wages: numberOrZero(e?.box_16_state_wages),
          box_17_state_income_tax: numberOrZero(e?.box_17_state_income_tax),
          locals: Array.isArray(e?.locals)
            ? (e.locals as NonNullable<W2["state_and_local"]["entries"][number]["locals"]>)
                .filter((l) => l && (l.box_20_locality_name || l.box_18_local_wages || l.box_19_local_income_tax))
                .map((l) => ({
                  box_20_locality_name: stringOrEmpty(l?.box_20_locality_name),
                  box_18_local_wages: (l?.box_18_local_wages as number | string | null | undefined) == null ? undefined : numberOrZero(l.box_18_local_wages as number | string),
                  box_19_local_income_tax: (l?.box_19_local_income_tax as number | string | null | undefined) == null ? undefined : numberOrZero(l.box_19_local_income_tax as number | string),
                }))
            : [],
        })),
      },
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Failed to process W-2 image" }, { status: 500 });
  }
}


