"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-session";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Form schema definition
const f8843FormSchema = z.object({
  // Header Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  taxId: z.string().optional(),
  foreignAddress: z.string().optional(),
  usAddress: z.string().optional(),

  // Part I - General Information
  visaInfo: z.object({
    type: z.enum(["F", "J", "M", "Q"]).describe("Please select a visa type"),
    entryDate: z.string().min(1, "Entry date is required"),
  }),
  nonimmigrantStatus: z.object({
    current: z.string().min(1, "Current nonimmigrant status is required"),
    changed: z.boolean(),
    changeDate: z.string().optional(),
    previousStatus: z.string().optional(),
  }),
  citizenshipCountries: z
    .string()
    .min(1, "Country(ies) of citizenship is required"),
  passport: z.object({
    issuingCountries: z
      .string()
      .min(1, "Passport issuing country(ies) is required"),
    numbers: z.string().min(1, "Passport number(s) is required"),
  }),
  daysPresent: z.object({
    year2024: z.string().min(1, "Days present in 2024 is required"),
    year2023: z.string().min(1, "Days present in 2023 is required"),
    year2022: z.string().min(1, "Days present in 2022 is required"),
    excludedDays2024: z
      .string()
      .min(1, "Number of excluded days for 2024 is required"),
  }),

  // Part II - Teachers and Trainees
  teacherTrainee: z.object({
    academicInstitution: z.string().optional(),
    directorInfo: z.string().optional(),
    historicalVisas: z.object({
      year2023: z.string().optional(),
      year2022: z.string().optional(),
      year2021: z.string().optional(),
      year2020: z.string().optional(),
      year2019: z.string().optional(),
      year2018: z.string().optional(),
    }),
    wasExemptPreviously: z.boolean().optional(),
  }),

  // Part III - Students
  student: z.object({
    academicInstitution: z.string().optional(),
    directorInfo: z.string().optional(),
    historicalVisas: z.object({
      year2023: z.string().optional(),
      year2022: z.string().optional(),
      year2021: z.string().optional(),
      year2020: z.string().optional(),
      year2019: z.string().optional(),
      year2018: z.string().optional(),
    }),
    exemptMoreThan5Years: z.boolean().optional(),
    lprStatus: z.object({
      appliedOrTookSteps: z.boolean().optional(),
      explanation: z.string().optional(),
    }),
  }),

  // Part IV - Professional Athletes
  athlete: z.object({
    events: z
      .array(
        z.object({
          name: z.string(),
          dates: z.string(),
          charityName: z.string(),
          charityEIN: z.string(),
        })
      )
      .optional(),
  }),

  // Part V - Medical Condition
  medicalCondition: z.object({
    description: z.string().optional(),
    intendedDepartureDate: z.string().optional(),
    actualDepartureDate: z.string().optional(),
    physician: z.object({
      patientName: z.string().optional(),
      name: z.string().optional(),
      contactInfo: z.string().optional(),
      signature: z.string().optional(),
      date: z.string().optional(),
    }),
  }),
});

type F8843FormValues = z.infer<typeof f8843FormSchema>;

export default function F8843Form() {
  const api = useApi();
  const [pdfFields, setPdfFields] = useState<{ name: string; type: string }[] | null>(null);
  const form = useForm<F8843FormValues>({
    resolver: zodResolver(f8843FormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      taxId: "",
      foreignAddress: "",
      usAddress: "",
      visaInfo: {
        type: undefined,
        entryDate: "",
      },
      nonimmigrantStatus: {
        current: "",
        changed: false,
        changeDate: "",
        previousStatus: "",
      },
      citizenshipCountries: "",
      passport: {
        issuingCountries: "",
        numbers: "",
      },
      daysPresent: {
        year2024: "",
        year2023: "",
        year2022: "",
        excludedDays2024: "",
      },
      teacherTrainee: {
        academicInstitution: "",
        directorInfo: "",
        historicalVisas: {
          year2023: "",
          year2022: "",
          year2021: "",
          year2020: "",
          year2019: "",
          year2018: "",
        },
        wasExemptPreviously: false,
      },
      student: {
        academicInstitution: "",
        directorInfo: "",
        historicalVisas: {
          year2023: "",
          year2022: "",
          year2021: "",
          year2020: "",
          year2019: "",
          year2018: "",
        },
        exemptMoreThan5Years: false,
        lprStatus: {
          appliedOrTookSteps: false,
          explanation: "",
        },
      },
      athlete: {
        events: [],
      },
      medicalCondition: {
        description: "",
        intendedDepartureDate: "",
        actualDepartureDate: "",
        physician: {
          patientName: "",
          name: "",
          contactInfo: "",
          signature: "",
          date: "",
        },
      },
    },
  });

  function onSubmit(values: F8843FormValues) {
    console.log(values);
    // Handle form submission
  }

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const res = await api('/api/users');
        if (!res.ok) return;
        const user = await res.json();
        if (!isActive || !user) return;
        const current = form.getValues();
        const patch: Partial<F8843FormValues> = mapUserToF8843(user);
        form.reset({ ...current, ...patch });
      } catch {}
    })();
    return () => {
      isActive = false;
    };
  }, [api, form]);

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Form 8843 - Statement for Exempt Individuals and Individuals With a
            Medical Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="text-sm underline hidden"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/forms/f8843/fields', { cache: 'no-store' });
                      const data = await res.json();
                      setPdfFields(data.fields || []);
                      console.log('F8843 PDF fields:', data.fields);
                      alert(`Found ${data.fields?.length ?? 0} PDF fields. Check console for details.`);
                    } catch {
                      alert('Failed to load PDF fields');
                    }
                  }}
                >
                  List PDF fields
                </button>
                <Button
                  type="button"
                  onClick={async () => {
                    // Heuristic mapping: try to map our form values to PDF field names
                    try {
                      let fields = pdfFields;
                      if (!fields) {
                        const res = await fetch('/api/forms/f8843/fields', { cache: 'no-store' });
                        const data = await res.json();
                        fields = data.fields || [];
                        setPdfFields(fields);
                      }
                      const values: Record<string, unknown> = {};
                      const v = form.getValues();

                      // Explicit mapping per requested order:
                      // 4th: First name and initial
                      values['topmostSubform[0].Page1[0].f1_4[0]'] = v.firstName ?? '';
                      // 5th: Last name
                      values['topmostSubform[0].Page1[0].f1_5[0]'] = v.lastName ?? '';
                      // 6th: TIN (SSN/ITIN)
                      values['topmostSubform[0].Page1[0].f1_6[0]'] = v.taxId ?? '';
                      // 7th: Address in country of residence
                      values['topmostSubform[0].Page1[0].f1_7[0]'] = v.foreignAddress ?? '';
                      // 8th: Address in the United States
                      values['topmostSubform[0].Page1[0].f1_8[0]'] = v.usAddress ?? '';

                      // Field 9: 1a Visa type and entry date
                      values['topmostSubform[0].Page1[0].f1_9[0]'] = `${v.visaInfo.type ?? ''}${v.visaInfo.entryDate ? ` - Entered: ${v.visaInfo.entryDate}` : ''}`.trim();
                      // Field 10: 1b Current status (+change date and previous status if applicable)
                      values['topmostSubform[0].Page1[0].f1_10[0]'] = `${v.nonimmigrantStatus.current ?? ''}${v.nonimmigrantStatus.changed && v.nonimmigrantStatus.changeDate ? ` - Changed on ${v.nonimmigrantStatus.changeDate}` : ''}${v.nonimmigrantStatus.changed && v.nonimmigrantStatus.previousStatus ? ` from ${v.nonimmigrantStatus.previousStatus}` : ''}`.trim();
                      // Field 11: 2 Citizenship countries
                      values['topmostSubform[0].Page1[0].f1_11[0]'] = v.citizenshipCountries ?? '';
                      // Field 12: 3a Passport issuing countries
                      values['topmostSubform[0].Page1[0].f1_12[0]'] = v.passport.issuingCountries ?? '';
                      // Field 13: 3b Passport number(s)
                      values['topmostSubform[0].Page1[0].f1_13[0]'] = v.passport.numbers ?? '';
                      // Field 14-16: 4a Days present 2024/2023/2022
                      values['topmostSubform[0].Page1[0].f1_14[0]'] = v.daysPresent.year2024 ?? '';
                      values['topmostSubform[0].Page1[0].f1_15[0]'] = v.daysPresent.year2023 ?? '';
                      values['topmostSubform[0].Page1[0].f1_16[0]'] = v.daysPresent.year2022 ?? '';
                      // Field 17: 4b Excluded days 2024
                      values['topmostSubform[0].Page1[0].f1_17[0]'] = v.daysPresent.excludedDays2024 ?? '';

                      // Keep heuristic fill to try other fields automatically
                      const lc = (s: string) => s.toLowerCase();
                      for (const f of fields || []) {
                        const n = lc(f.name);
                        if (values[f.name] !== undefined) continue; // skip already mapped
                        if (n.includes('first') && n.includes('name')) values[f.name] = v.firstName;
                        else if ((n.includes('last') && n.includes('name')) || n === 'lastname') values[f.name] = v.lastName;
                        else if (n.includes('ssn') || n.includes('itin') || n.includes('tax')) values[f.name] = v.taxId;
                        else if (n.includes('foreign') && n.includes('address')) values[f.name] = v.foreignAddress;
                        else if ((n.includes('us') && n.includes('address')) || n.includes('address united')) values[f.name] = v.usAddress;
                        else if (n.includes('visa') && n.includes('type')) values[f.name] = v.visaInfo.type ?? '';
                        else if ((n.includes('enter') || n.includes('entry')) && n.includes('date')) values[f.name] = v.visaInfo.entryDate;
                        else if (n.includes('current') && n.includes('status')) values[f.name] = v.nonimmigrantStatus.current;
                        else if (n.includes('change') && n.includes('date')) values[f.name] = v.nonimmigrantStatus.changeDate ?? '';
                        else if (n.includes('previous') && n.includes('status')) values[f.name] = v.nonimmigrantStatus.previousStatus ?? '';
                        else if (n.includes('citizen')) values[f.name] = v.citizenshipCountries;
                        else if (n.includes('passport') && (n.includes('number') || n.endsWith('no') || n.endsWith('num'))) values[f.name] = v.passport.numbers;
                        else if (n.includes('passport') && (n.includes('issuer') || n.includes('issuing'))) values[f.name] = v.passport.issuingCountries;
                        else if (n.includes('2024') && n.includes('exclude')) values[f.name] = v.daysPresent.excludedDays2024;
                        else if (n.includes('2024')) values[f.name] = v.daysPresent.year2024;
                        else if (n.includes('2023')) values[f.name] = v.daysPresent.year2023;
                        else if (n.includes('2022')) values[f.name] = v.daysPresent.year2022;
                      }

                      const res = await fetch('/api/forms/f8843/fill', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ values }),
                      });
                      if (!res.ok) throw new Error('Failed to generate PDF');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'f8843_filled.pdf';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {
                      alert('Failed to download filled PDF');
                    }
                  }}
                >
                  Download Filled PDF
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/forms/f8843/download', { cache: 'no-store' });
                      if (!res.ok) throw new Error('Failed to download');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'f8843_2025_new.pdf';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {
                      alert('Failed to download empty PDF');
                    }
                  }}
                >
                  Download Empty Form
                </Button>
              </div>
              {/* Header Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Header Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name and Initial</Label>
                    <Input
                      {...form.register("firstName")}
                      id="firstName"
                      placeholder="Enter your first name and middle initial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      {...form.register("lastName")}
                      id="lastName"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    U.S. Taxpayer ID (SSN/ITIN), if any
                  </Label>
                  <Input
                    {...form.register("taxId")}
                    id="taxId"
                    placeholder="Enter your SSN or ITIN (if you have one)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foreignAddress">
                    Address in Country of Residence
                  </Label>
                  <Textarea
                    {...form.register("foreignAddress")}
                    id="foreignAddress"
                    placeholder="Enter your foreign address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usAddress">Address in United States</Label>
                  <Textarea
                    {...form.register("usAddress")}
                    id="usAddress"
                    placeholder="Enter your U.S. address"
                  />
                  <p className="text-sm text-gray-500 italic">
                    Note: Complete addresses only if filing Form 8843 by itself
                    and not with a U.S. tax return.
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Part I - General Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Part I - General Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type of U.S. Visa</Label>
                      <RadioGroup
                        onValueChange={(value) =>
                          form.setValue(
                            "visaInfo.type",
                            value as "F" | "J" | "M" | "Q"
                          )
                        }
                        defaultValue={form.getValues("visaInfo.type")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="F" id="visa-f" />
                          <Label htmlFor="visa-f">F</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="J" id="visa-j" />
                          <Label htmlFor="visa-j">J</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="M" id="visa-m" />
                          <Label htmlFor="visa-m">M</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Q" id="visa-q" />
                          <Label htmlFor="visa-q">Q</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entryDate">
                        Date You Entered the United States
                      </Label>
                      <Input
                        {...form.register("visaInfo.entryDate")}
                        id="entryDate"
                        type="date"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStatus">
                        Current Nonimmigrant Status
                      </Label>
                      <Input
                        {...form.register("nonimmigrantStatus.current")}
                        id="currentStatus"
                        placeholder="Enter your current nonimmigrant status"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...form.register("nonimmigrantStatus.changed")}
                          id="statusChanged"
                        />
                        <Label htmlFor="statusChanged">
                          Status changed during the tax year
                        </Label>
                      </div>
                      {form.watch("nonimmigrantStatus.changed") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="changeDate">Date of Change</Label>
                            <Input
                              {...form.register(
                                "nonimmigrantStatus.changeDate"
                              )}
                              id="changeDate"
                              type="date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="previousStatus">
                              Previous Status
                            </Label>
                            <Input
                              {...form.register(
                                "nonimmigrantStatus.previousStatus"
                              )}
                              id="previousStatus"
                              placeholder="Enter your previous status"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="citizenshipCountries">
                      Country(ies) of Citizenship During the Tax Year
                    </Label>
                    <Input
                      {...form.register("citizenshipCountries")}
                      id="citizenshipCountries"
                      placeholder="Enter country or countries of citizenship"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issuingCountries">
                        Country(ies) that Issued Your Passport
                      </Label>
                      <Input
                        {...form.register("passport.issuingCountries")}
                        id="issuingCountries"
                        placeholder="Enter country or countries that issued your passport"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passportNumbers">
                        Passport Number(s)
                      </Label>
                      <Input
                        {...form.register("passport.numbers")}
                        id="passportNumbers"
                        placeholder="Enter your passport number(s)"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Days Present in the United States</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year2024">2024</Label>
                        <Input
                          {...form.register("daysPresent.year2024")}
                          id="year2024"
                          type="number"
                          placeholder="Number of days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year2023">2023</Label>
                        <Input
                          {...form.register("daysPresent.year2023")}
                          id="year2023"
                          type="number"
                          placeholder="Number of days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year2022">2022</Label>
                        <Input
                          {...form.register("daysPresent.year2022")}
                          id="year2022"
                          type="number"
                          placeholder="Number of days"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="excludedDays2024">
                          2024 Days Excluded
                        </Label>
                        <Input
                          {...form.register("daysPresent.excludedDays2024")}
                          id="excludedDays2024"
                          type="number"
                          placeholder="Number of days"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Part II - Teachers and Trainees */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Part II - Teachers and Trainees
                </h2>
                <p className="text-sm text-gray-500">
                  Complete this section if you were a teacher or trainee on a J
                  or Q visa
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherInstitution">
                      For Teachers: Academic Institution
                    </Label>
                    <Textarea
                      {...form.register("teacherTrainee.academicInstitution")}
                      id="teacherInstitution"
                      placeholder="Enter name, address, and telephone number of the academic institution where you taught in 2024"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="traineeDirector">
                      For Trainees: Program Director
                    </Label>
                    <Textarea
                      {...form.register("teacherTrainee.directorInfo")}
                      id="traineeDirector"
                      placeholder="Enter name, address, and telephone number of the director of the academic or specialized program you participated in during 2024"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>
                      Type of U.S. Visa (J or Q) Held During Previous Years
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="visa2023">2023</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2023"
                          )}
                          id="visa2023"
                          placeholder="J or Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa2022">2022</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2022"
                          )}
                          id="visa2022"
                          placeholder="J or Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa2021">2021</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2021"
                          )}
                          id="visa2021"
                          placeholder="J or Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa2020">2020</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2020"
                          )}
                          id="visa2020"
                          placeholder="J or Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa2019">2019</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2019"
                          )}
                          id="visa2019"
                          placeholder="J or Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa2018">2018</Label>
                        <Input
                          {...form.register(
                            "teacherTrainee.historicalVisas.year2018"
                          )}
                          id="visa2018"
                          placeholder="J or Q"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      If visa type changed in any year, attach a statement
                      showing the new type and the date acquired.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register("teacherTrainee.wasExemptPreviously")}
                        id="wasExemptPreviously"
                      />
                      <Label htmlFor="wasExemptPreviously">
                        Were you exempt as a teacher, trainee, or student for
                        any part of 2 of the preceding 6 calendar years
                        (2018-2023)?
                      </Label>
                    </div>
                    {form.watch("teacherTrainee.wasExemptPreviously") && (
                      <p className="text-sm text-red-500 mt-2">
                        Note: If &quot;Yes&quot;, you cannot exclude
                        teacher/trainee days unless you meet the Exception in
                        the instructions.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Part III - Students */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Part III - Students</h2>
                <p className="text-sm text-gray-500">
                  Complete this section if you were a student on an F, J, M, or
                  Q visa
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentInstitution">
                      Academic Institution Information
                    </Label>
                    <Textarea
                      {...form.register("student.academicInstitution")}
                      id="studentInstitution"
                      placeholder="Enter name, address, and telephone number of the academic institution you attended during 2024"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programDirector">
                      Program Director Information
                    </Label>
                    <Textarea
                      {...form.register("student.directorInfo")}
                      id="programDirector"
                      placeholder="Enter name, address, and telephone number of the director of the academic or specialized program you participated in during 2024"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>
                      Type of U.S. Visa (F, J, M, or Q) Held During Previous
                      Years
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2023">2023</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2023")}
                          id="studentVisa2023"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2022">2022</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2022")}
                          id="studentVisa2022"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2021">2021</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2021")}
                          id="studentVisa2021"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2020">2020</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2020")}
                          id="studentVisa2020"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2019">2019</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2019")}
                          id="studentVisa2019"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentVisa2018">2018</Label>
                        <Input
                          {...form.register("student.historicalVisas.year2018")}
                          id="studentVisa2018"
                          placeholder="F/J/M/Q"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      If visa type changed in any year, attach a statement
                      showing the new type and the date acquired.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register("student.exemptMoreThan5Years")}
                        id="exemptMoreThan5Years"
                      />
                      <Label htmlFor="exemptMoreThan5Years">
                        Were you exempt as a teacher, trainee, or student for
                        any part of more than 5 calendar years?
                      </Label>
                    </div>
                    {form.watch("student.exemptMoreThan5Years") && (
                      <p className="text-sm text-gray-500 italic">
                        If &quot;Yes&quot;, attach facts to establish you
                        don&apos;t intend to reside permanently in the U.S.
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...form.register(
                            "student.lprStatus.appliedOrTookSteps"
                          )}
                          id="appliedLPR"
                        />
                        <Label htmlFor="appliedLPR">
                          During 2024, did you apply for, or take other
                          affirmative steps to apply for, lawful permanent
                          resident status in the U.S., or have a pending
                          application to change to LPR status?
                        </Label>
                      </div>
                      {form.watch("student.lprStatus.appliedOrTookSteps") && (
                        <div className="mt-2">
                          <Label htmlFor="lprExplanation">Please Explain</Label>
                          <Textarea
                            {...form.register("student.lprStatus.explanation")}
                            id="lprExplanation"
                            placeholder="Explain the steps taken or application status"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Part IV - Professional Athletes */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Part IV - Professional Athletes
                </h2>
                <p className="text-sm text-gray-500">
                  Complete this section if you were a professional athlete
                  temporarily present to compete in a charitable sports event
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sportsEvent">
                      Charitable Sports Event Information
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                      {form.watch("athlete.events")?.map((_, index) => (
                        <div
                          key={index}
                          className="space-y-4 p-4 border rounded-lg"
                        >
                          <div className="space-y-2">
                            <Label htmlFor={`eventName${index}`}>
                              Event Name
                            </Label>
                            <Input
                              {...form.register(`athlete.events.${index}.name`)}
                              id={`eventName${index}`}
                              placeholder="Enter the name of the charitable sports event"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`eventDates${index}`}>
                              Event Dates
                            </Label>
                            <Input
                              {...form.register(
                                `athlete.events.${index}.dates`
                              )}
                              id={`eventDates${index}`}
                              placeholder="Enter the dates of competition"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`charityName${index}`}>
                              Charitable Organization Name
                            </Label>
                            <Input
                              {...form.register(
                                `athlete.events.${index}.charityName`
                              )}
                              id={`charityName${index}`}
                              placeholder="Enter the name of the charitable organization"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`charityEIN${index}`}>
                              Charitable Organization EIN
                            </Label>
                            <Input
                              {...form.register(
                                `athlete.events.${index}.charityEIN`
                              )}
                              id={`charityEIN${index}`}
                              placeholder="Enter the employer identification number (EIN)"
                            />
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              const events =
                                form.getValues("athlete.events") || [];
                              events.splice(index, 1);
                              form.setValue("athlete.events", [...events]);
                            }}
                          >
                            Remove Event
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        const events = form.getValues("athlete.events") || [];
                        form.setValue("athlete.events", [
                          ...events,
                          {
                            name: "",
                            dates: "",
                            charityName: "",
                            charityEIN: "",
                          },
                        ]);
                      }}
                    >
                      Add Another Event
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    Note: Attach a statement verifying all net proceeds were
                    contributed to the listed charitable organization(s).
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Part V - Medical Condition */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Part V - Medical Condition or Medical Problem
                </h2>
                <p className="text-sm text-gray-500">
                  Complete this section if you had a medical condition or
                  medical problem that prevented you from leaving the U.S.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalDescription">
                      Description of Medical Condition
                    </Label>
                    <Textarea
                      {...form.register("medicalCondition.description")}
                      id="medicalDescription"
                      placeholder="Describe the medical condition or problem that prevented you from leaving the U.S."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="intendedDepartureDate">
                        Intended Departure Date
                      </Label>
                      <Input
                        {...form.register(
                          "medicalCondition.intendedDepartureDate"
                        )}
                        id="intendedDepartureDate"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualDepartureDate">
                        Actual Departure Date
                      </Label>
                      <Input
                        {...form.register(
                          "medicalCondition.actualDepartureDate"
                        )}
                        id="actualDepartureDate"
                        type="date"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">
                      Physician&apos;s Statement
                    </h3>
                    <p className="text-sm text-gray-500">
                      To be completed by physician or other medical official
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientName">Patient Name</Label>
                        <Input
                          {...form.register(
                            "medicalCondition.physician.patientName"
                          )}
                          id="patientName"
                          placeholder="Enter the patient's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="physicianName">Physician Name</Label>
                        <Input
                          {...form.register("medicalCondition.physician.name")}
                          id="physicianName"
                          placeholder="Enter the physician's name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="physicianContact">
                        Physician Address and Telephone Number
                      </Label>
                      <Textarea
                        {...form.register(
                          "medicalCondition.physician.contactInfo"
                        )}
                        id="physicianContact"
                        placeholder="Enter physician's address and telephone number"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="physicianSignature">
                          Physician Signature
                        </Label>
                        <Input
                          {...form.register(
                            "medicalCondition.physician.signature"
                          )}
                          id="physicianSignature"
                          placeholder="Physician's signature"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="physicianDate">Date</Label>
                        <Input
                          {...form.register("medicalCondition.physician.date")}
                          id="physicianDate"
                          type="date"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      By signing, the physician certifies that the taxpayer
                      couldn&apos;t leave on the intended departure date due to
                      the medical condition and that it wasn&apos;t preexisting.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Signature Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Signature</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signature">Signature</Label>
                    <Input
                      value={`${form.getValues("firstName")} ${form.getValues(
                        "lastName"
                      )}`}
                      id="signature"
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatureDate">Date</Label>
                    <Input
                      type="date"
                      value={new Date().toISOString().split("T")[0]}
                      id="signatureDate"
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

type ApiUser = {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    ssnTin?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

function mapUserToF8843(user: ApiUser): Partial<F8843FormValues> {
  const firstName = user?.personalInfo?.firstName || "";
  const lastName = user?.personalInfo?.lastName || "";
  const taxId = user?.personalInfo?.ssnTin || "";
  const parts = [
    user?.address?.street,
    [user?.address?.city, user?.address?.state].filter(Boolean).join(", "),
    user?.address?.zip,
  ].filter((p) => p && String(p).trim().length > 0);
  const usAddress = parts.join("\n");

  return {
    firstName,
    lastName,
    taxId,
    usAddress,
  };
}
