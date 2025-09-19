"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useCallback, useEffect, useRef, useState } from "react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useApi } from "@/hooks/use-session";
import type { UserW2Data } from "@/lib/interfaces/user";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Import W2 interface
// import type { W2 } from "@/lib/interfaces/w2";

const w2FormSchema = z.object({
  tax_year: z.number().min(1900).max(new Date().getFullYear() + 1),

  // Identification and Address
  box_a_employee_ssn: z.string().regex(/^[0-9]{3}-?[0-9]{2}-?[0-9]{4}$/, "Please enter a valid SSN"),
  box_b_employer_ein: z.string().regex(/^[0-9]{2}-?[0-9]{7}$/, "Please enter a valid EIN"),
  
  box_c_employer_name_address_zip: z.object({
    name: z.string().min(1, "Employer name is required"),
    address_line1: z.string().min(1, "Address is required"),
    address_line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "Please enter a valid 2-letter state code"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code")
  }),

  box_d_control_number: z.string().optional(),

  box_e_employee_name: z.object({
    first: z.string().min(1, "First name is required"),
    middle_initial: z.string().optional(),
    last: z.string().min(1, "Last name is required"),
    suffix: z.string().optional()
  }),

  box_f_employee_address_zip: z.object({
    address_line1: z.string().min(1, "Address is required"),
    address_line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "Please enter a valid 2-letter state code"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code")
  }),

  // Federal Wages and Taxes
  federal_wages_and_taxes: z.object({
    box_1_wages_tips_other_comp: z.number().min(0),
    box_2_federal_income_tax_withheld: z.number().min(0),
    box_3_social_security_wages: z.number().min(0),
    box_4_social_security_tax_withheld: z.number().min(0),
    box_5_medicare_wages_and_tips: z.number().min(0),
    box_6_medicare_tax_withheld: z.number().min(0),
    box_7_social_security_tips: z.number().min(0),
    box_8_allocated_tips: z.number().min(0),
    box_10_dependent_care_benefits: z.number().min(0),
    box_11_nonqualified_plans: z.number().min(0),
    
    box_13_checkboxes: z.object({
      statutory_employee: z.boolean(),
      retirement_plan: z.boolean(),
      third_party_sick_pay: z.boolean()
    }),

    box_12_items: z.array(z.object({
      code: z.enum([
        'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S',
        'T','V','W','Y','Z','AA','BB','DD','EE','FF','GG','HH','II'
      ]),
      amount: z.number().min(0)
    })).max(4),

    box_14_other: z.array(z.object({
      label: z.string().min(1, "Label is required"),
      amount: z.number().min(0)
    }))
  }),

  // State and Local
  state_and_local: z.object({
    entries: z.array(z.object({
      box_15_state: z.string().length(2, "Please enter a valid 2-letter state code"),
      box_15_employer_state_id: z.string().min(1, "State ID is required"),
      box_16_state_wages: z.number().min(0),
      box_17_state_income_tax: z.number().min(0),
      locals: z.array(z.object({
        box_20_locality_name: z.string(),
        box_18_local_wages: z.number().min(0).optional(),
        box_19_local_income_tax: z.number().min(0).optional()
      })).optional()
    }))
  })
});

export default function W2Form() {
  const api = useApi();
  const [userId, setUserId] = useState<string | null>(null);
  const form = useForm<z.infer<typeof w2FormSchema>>({
    resolver: zodResolver(w2FormSchema),
    defaultValues: {
      tax_year: new Date().getFullYear(),
      box_a_employee_ssn: "",
      box_b_employer_ein: "",
      box_c_employer_name_address_zip: {
        name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip: ""
      },
      box_d_control_number: "",
      box_e_employee_name: {
        first: "",
        middle_initial: "",
        last: "",
        suffix: ""
      },
      box_f_employee_address_zip: {
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip: ""
      },
      federal_wages_and_taxes: {
        box_1_wages_tips_other_comp: 0,
        box_2_federal_income_tax_withheld: 0,
        box_3_social_security_wages: 0,
        box_4_social_security_tax_withheld: 0,
        box_5_medicare_wages_and_tips: 0,
        box_6_medicare_tax_withheld: 0,
        box_7_social_security_tips: 0,
        box_8_allocated_tips: 0,
        box_10_dependent_care_benefits: 0,
        box_11_nonqualified_plans: 0,
        box_13_checkboxes: {
          statutory_employee: false,
          retirement_plan: false,
          third_party_sick_pay: false
        },
        box_14_other: []
      },
      state_and_local: {
        entries: []
      }
    }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "image/jpg",
  ];

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Unsupported file type. Upload JPG, PNG, WEBP, or PDF.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "File is too large. Max size is 10 MB.";
    }
    return null;
  }

  function onFilesSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setUploadError(err);
      setUploadSuccess(false);
      return;
    }
    setUploadError(null);
    setSelectedFileName(file.name);
    handleUpload(file);
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isUploading) {
      setUploadProgress(10);
      interval = setInterval(() => {
        setUploadProgress((current) => {
          if (current >= 90) return current;
          const increment = Math.random() * 8 + 2; // +2% to +10%
          return Math.min(90, current + increment);
        });
      }, 400);
    } else {
      if (uploadSuccess) {
        setUploadProgress(100);
        const t = setTimeout(() => setUploadProgress(0), 800);
        return () => clearTimeout(t);
      } else {
        setUploadProgress(0);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading, uploadSuccess]);

  type ApiUser = {
    personalInfo?: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      suffix?: string;
      ssnTin?: string;
    };
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
  };

  const toMiddleInitial = useCallback((value?: string): string => {
    const v = (value || "").trim();
    if (!v) return "";
    const first = v.replace(/\./g, "").charAt(0);
    return first ? first.toUpperCase() : "";
  }, []);

  const mapUserToW2Defaults = useCallback((user: ApiUser) => {
    return {
      box_a_employee_ssn: user?.personalInfo?.ssnTin ?? "",
      box_e_employee_name: {
        first: user?.personalInfo?.firstName ?? "",
        middle_initial: toMiddleInitial(user?.personalInfo?.middleName),
        last: user?.personalInfo?.lastName ?? "",
        suffix: user?.personalInfo?.suffix ?? "",
      },
      box_f_employee_address_zip: {
        address_line1: user?.address?.addressLine1 ?? "",
        address_line2: user?.address?.addressLine2 ?? "",
        city: user?.address?.city ?? "",
        state: user?.address?.state ?? "",
        zip: user?.address?.zip ?? "",
      },
    } as Partial<z.infer<typeof w2FormSchema>>;
  }, [toMiddleInitial]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const res = await api('/api/users');
        if (!res.ok) return;
        const user = (await res.json()) as ApiUser & { _id?: string };
        if (!isActive || !user) return;
        if (user._id) setUserId(String(user._id));
        const mapped = mapUserToW2Defaults(user);
        form.reset({
          ...form.getValues(),
          ...mapped,
        });
      } catch {}
    })();
    return () => {
      isActive = false;
    };
  }, [api, form, mapUserToW2Defaults]);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/forms/w2/upload", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        let message = "Upload failed";
        try {
          const err = await res.json();
          if (err?.error) message = err.error as string;
        } catch {}
        throw new Error(message);
      }
      const data = await res.json();
      const merged = {
        ...data,
        box_a_employee_ssn: form.getValues("box_a_employee_ssn"),
        box_e_employee_name: {
          ...(data?.box_e_employee_name ?? {}),
          ...form.getValues("box_e_employee_name"),
        },
        box_f_employee_address_zip: {
          ...(data?.box_f_employee_address_zip ?? {}),
          ...form.getValues("box_f_employee_address_zip"),
        },
      } as z.infer<typeof w2FormSchema>;
      form.reset({
        ...form.getValues(),
        ...merged,
      });
      setUploadSuccess(true);
      setIsAutofilled(true);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsUploading(false);
    }
  }

  // Field arrays for dynamic sections
  const { fields: box12Fields, append: appendBox12, remove: removeBox12 } = 
    useFieldArray({
      control: form.control,
      name: "federal_wages_and_taxes.box_12_items"
    });

  const { fields: box14Fields, append: appendBox14, remove: removeBox14 } = 
    useFieldArray({
      control: form.control,
      name: "federal_wages_and_taxes.box_14_other"
    });

  const { fields: stateFields, append: appendState, remove: removeState } = 
    useFieldArray({
      control: form.control,
      name: "state_and_local.entries"
    });

  // Box 12 codes for select options
  const box12Codes = [
    'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S',
    'T','V','W','Y','Z','AA','BB','DD','EE','FF','GG','HH','II'
  ];

  async function onSubmit(values: z.infer<typeof w2FormSchema>) {
    const payload: UserW2Data = {
      tax_year: values.tax_year,
      box_b_employer_ein: values.box_b_employer_ein,
      box_c_employer_name_address_zip: values.box_c_employer_name_address_zip,
      box_d_control_number: values.box_d_control_number || null,
      federal_wages_and_taxes: values.federal_wages_and_taxes,
      state_and_local: values.state_and_local,
    };
    try {
      const method = userId ? 'PUT' : 'POST';
      const url = userId ? `/api/users?id=${encodeURIComponent(userId)}` : '/api/users';
      const body = userId ? { w2: [payload] } : {
        // For brand new user creation fallback, keep minimal to satisfy schema
        personalInfo: {
          firstName: values.box_e_employee_name.first,
          middleName: values.box_e_employee_name.middle_initial || undefined,
          lastName: values.box_e_employee_name.last,
          suffix: values.box_e_employee_name.suffix || undefined,
          ssnTin: values.box_a_employee_ssn,
          dateOfBirth: new Date(),
          phone: '',
          email: '',
        },
        address: {
          addressLine1: values.box_f_employee_address_zip.address_line1,
          addressLine2: values.box_f_employee_address_zip.address_line2 || '',
          city: values.box_f_employee_address_zip.city,
          state: values.box_f_employee_address_zip.state,
          zip: values.box_f_employee_address_zip.zip,
          residencyState: '',
        },
        statusInfo: { isUSResident: false, status: 'student' },
        w2: [payload],
      };
      const res = await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Failed to save W-2');
      }
      toast.success('W-2 information saved successfully');
      setIsAutofilled(false);
      setUploadSuccess(false);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Failed to save W-2';
      toast.error(message);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>W-2 Wage and Tax Statement</CardTitle>
          <CardDescription>
            Enter your W-2 information for tax year {form.getValues("tax_year")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Upload Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Upload your W-2</h3>
                <div
                  className={
                    `group relative rounded-lg border-2 border-dashed p-6 transition-colors ` +
                    `${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"} ` +
                    `${isUploading ? "opacity-80" : ""}`
                  }
                  role="button"
                  tabIndex={0}
                  aria-busy={isUploading}
                  aria-label="Upload W-2 by dragging and dropping or browsing"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isUploading) setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    if (!isUploading) onFilesSelected(e.dataTransfer.files);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag & drop your W‑2 image or PDF</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or PDF • Max 10 MB</p>
                    <div className="pt-1">
                      <Button type="button" variant="secondary" size="sm" disabled={isUploading}>
                        Browse files
                      </Button>
                    </div>
                    {selectedFileName && (
                      <p className="text-xs text-muted-foreground">Selected: {selectedFileName}</p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => onFilesSelected(e.target.files)}
                    disabled={isUploading}
                  />
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Alert>
                      <AlertTitle>Analyzing your document…</AlertTitle>
                      <AlertDescription>
                        Extracting W-2 fields. This usually takes a few seconds.
                      </AlertDescription>
                    </Alert>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                {uploadSuccess && (
                  <Alert>
                    <AlertTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" /> Autofill complete
                    </AlertTitle>
                    <AlertDescription>
                      We extracted your W-2 and filled the form below. Please review for accuracy.
                    </AlertDescription>
                  </Alert>
                )}
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Upload failed
                    </AlertTitle>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
                {isAutofilled && !isUploading && !uploadError && (
                  <p className="text-sm text-muted-foreground">Status: Filled from uploaded W-2</p>
                )}
              </div>
              {/* Identification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Identification Information</h3>
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_a_employee_ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee&apos;s SSN (Box a)</FormLabel>
                        <FormControl>
                          <Input placeholder="XXX-XX-XXXX" {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_b_employer_ein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer&apos;s EIN (Box b)</FormLabel>
                        <FormControl>
                          <Input placeholder="XX-XXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="box_d_control_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Control Number (Box d)</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional control number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Employer Information */}
                <h4 className="text-md font-medium pt-4">Employer Information (Box c)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Employer&apos;s Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.address_line1"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.address_line2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input 
                            maxLength={2}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_c_employer_name_address_zip.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Employee Information */}
                <h4 className="text-md font-medium pt-4">Employee Information (Box e)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="box_e_employee_name.first"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_e_employee_name.middle_initial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Initial</FormLabel>
                        <FormControl>
                          <Input maxLength={1} {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_e_employee_name.last"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_e_employee_name.suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suffix</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Employee Address */}
                <h4 className="text-md font-medium pt-4">Employee Address (Box f)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="box_f_employee_address_zip.address_line1"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_f_employee_address_zip.address_line2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_f_employee_address_zip.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_f_employee_address_zip.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input 
                            maxLength={2}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            readOnly
                            aria-readonly="true"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="box_f_employee_address_zip.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly aria-readonly="true" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Federal Wages and Taxes Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Federal Wages and Taxes</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_1_wages_tips_other_comp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wages, Tips, Other Compensation (Box 1)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_2_federal_income_tax_withheld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Federal Income Tax Withheld (Box 2)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_3_social_security_wages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Wages (Box 3)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_4_social_security_tax_withheld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Tax Withheld (Box 4)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_5_medicare_wages_and_tips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medicare Wages and Tips (Box 5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_6_medicare_tax_withheld"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medicare Tax Withheld (Box 6)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_7_social_security_tips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Tips (Box 7)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_8_allocated_tips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocated Tips (Box 8)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_10_dependent_care_benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dependent Care Benefits (Box 10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_11_nonqualified_plans"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nonqualified Plans (Box 11)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Box 12 Dynamic Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">Box 12 Items</h4>
                    {box12Fields.length < 4 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendBox12({ code: 'A', amount: 0 })}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Box 12 Item
                      </Button>
                    )}
                  </div>
                  {box12Fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start">
                      <FormField
                        control={form.control}
                        name={`federal_wages_and_taxes.box_12_items.${index}.code`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Code</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select code" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {box12Codes.map((code) => (
                                  <SelectItem key={code} value={code}>
                                    {code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`federal_wages_and_taxes.box_12_items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-8"
                        onClick={() => removeBox12(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Box 14 Other Dynamic Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">Box 14 Other</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendBox14({ label: "", amount: 0 })}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Other Item
                    </Button>
                  </div>
                  {box14Fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start">
                      <FormField
                        control={form.control}
                        name={`federal_wages_and_taxes.box_14_other.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`federal_wages_and_taxes.box_14_other.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-8"
                        onClick={() => removeBox14(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Box 13 Checkboxes */}
                <h4 className="text-md font-medium pt-4">Box 13</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_13_checkboxes.statutory_employee"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Statutory Employee</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_13_checkboxes.retirement_plan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Retirement Plan</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="federal_wages_and_taxes.box_13_checkboxes.third_party_sick_pay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Third-party Sick Pay</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* State and Local Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">State and Local Taxes</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendState({
                      box_15_state: "",
                      box_15_employer_state_id: "",
                      box_16_state_wages: 0,
                      box_17_state_income_tax: 0,
                      locals: []
                    })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add State Entry
                  </Button>
                </div>
                {stateFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium">State Entry {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeState(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`state_and_local.entries.${index}.box_15_state`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input
                                  maxLength={2}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`state_and_local.entries.${index}.box_15_employer_state_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employer State ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`state_and_local.entries.${index}.box_16_state_wages`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State Wages</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`state_and_local.entries.${index}.box_17_state_income_tax`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State Income Tax</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Save W-2 Information
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
