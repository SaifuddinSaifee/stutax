"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-session";
import { toast } from "sonner";

const formSchema = z.object({
  // Personal Information (mandatory)
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.union([z.string().min(1, "Middle name must be at least 1 character"), z.literal("")]).optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  suffix: z.union([z.string().min(1, "Suffix must be at least 1 character"), z.literal("")]).optional(),
  ssnTin: z
    .string()
    .regex(
      /^\d{3}-?\d{2}-?\d{4}$/,
      "Please enter a valid SSN/TIN (XXX-XX-XXXX)"
    ),
  dateOfBirth: z.date({
    message: "Please select a date of birth",
  }),
  phone: z
    .string()
    .regex(
      /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      "Please enter a valid phone number"
    ),
  email: z.string().email("Please enter a valid email address"),

  // Address Information (not mandatory)
  addressLine1: z.union([z.string().min(5, "Please enter a valid street address"), z.literal("")]),
  addressLine2: z.union([z.string(), z.literal("")]).optional(),
  city: z.union([z.string().min(2, "Please enter a valid city"), z.literal("")]),
  state: z.union([z.string().length(2, "Please enter a valid 2-letter state code").toUpperCase(), z.literal("")]),
  zip: z.union([z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"), z.literal("")]),
  residencyState: z.union([z.string().length(2, "Please enter a valid 2-letter state code").toUpperCase(), z.literal("")]),

  // Status Information (not mandatory)
  isUSResident: z.enum(["yes", "no"]).optional(),
  status: z.enum(["student", "professional"]).optional(),
  universityName: z.union([z.string().min(2, "University name must be at least 2 characters"), z.literal("")]).optional(),
  employmentType: z.enum(["employed", "freelancer"]).optional(),
  companyName: z.union([z.string().min(2, "Company name must be at least 2 characters"), z.literal("")]).optional(),
  freelanceYears: z.union([z.string().regex(/^\d+$/, "Please enter a valid number"), z.literal("")]).optional(),
});

export default function ProfilePage() {
  const api = useApi();
  const [userId, setUserId] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      ssnTin: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      residencyState: "",
      isUSResident: undefined,
      status: undefined,
      universityName: "",
      employmentType: undefined,
      companyName: "",
      freelanceYears: "",
    },
  });

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const res = await api('/api/users');
        if (!res.ok) return;
        const user = await res.json();
        if (!isActive || !user) return;
        if (user._id) setUserId(user._id as string);
        const mapped = mapUserToFormDefaults(user);
        form.reset(mapped);
      } catch {}
    })();
    return () => {
      isActive = false;
    };
  }, [api, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = mapFormToUserUpdates(values);
    try {
      const url = userId ? `/api/users?id=${encodeURIComponent(userId)}` : '/api/users';
      const method = userId ? 'PUT' : 'POST';
      const res = await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to save');
      }
      toast.success('Profile saved successfully');
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Failed to save';
      toast.error(message);
    }
  }

  function onInvalid(errors: FieldErrors<z.infer<typeof formSchema>>) {
    const LABELS: Record<string, string> = {
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      suffix: 'Suffix',
      ssnTin: 'SSN / TIN',
      dateOfBirth: 'Date of Birth',
      phone: 'Phone',
      email: 'Email',
      addressLine1: 'Street Address',
      addressLine2: 'Address Line 2',
      city: 'City',
      state: 'State',
      zip: 'ZIP',
      residencyState: 'Residency State',
      isUSResident: 'US Residency',
      status: 'Status',
      universityName: 'University Name',
      employmentType: 'Employment Type',
      companyName: 'Company Name',
      freelanceYears: 'Years of Freelancing',
    };
    const keys = Object.keys(errors ?? {});
    if (keys.length > 0) {
      const fields = keys.map((k) => LABELS[k] ?? k).join(', ');
      toast.error(`Please fix ${keys.length} field${keys.length > 1 ? 's' : ''}: ${fields}.`);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Please fill in your personal and address information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="A." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suffix (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Jr., Sr., III" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ssnTin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSN / TIN</FormLabel>
                        <FormControl>
                          <Input placeholder="XXX-XX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 555-5555" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-lg font-medium pt-4">
                  Address Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address Line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt, suite, unit, building, floor, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            maxLength={2}
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="residencyState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residency State</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            maxLength={2}
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium pt-4">Status Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="isUSResident"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Are you a US Resident?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your residency status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("isUSResident") && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="professional">
                                Professional
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("status") === "student" && (
                    <>
                      <FormField
                        control={form.control}
                        name="universityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>University Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter university name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch("status") === "professional" && (
                    <>
                      <FormField
                        control={form.control}
                        name="employmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select employment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employed">
                                  Employed
                                </SelectItem>
                                <SelectItem value="freelancer">
                                  Freelancer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("employmentType") === "employed" && (
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter company name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {form.watch("employmentType") === "freelancer" && (
                        <FormField
                          control={form.control}
                          name="freelanceYears"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Freelancing</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter years of experience"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Save Information
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

type ApiUser = {
  personalInfo?: {
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    suffix?: string;
    ssnTin?: string;
    dateOfBirth?: string | Date;
    phone?: string;
    email?: string;
  };
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    residencyState?: string;
  };
  statusInfo?: {
    isUSResident?: boolean;
    status?: 'student' | 'professional';
    studentInfo?: { universityName?: string };
    professionalInfo?: {
      employmentType?: 'employed' | 'freelancer';
      companyName?: string;
      freelanceYears?: number;
    };
  };
};

function mapUserToFormDefaults(user: ApiUser) {
  return {
    firstName: user?.personalInfo?.firstName ?? "",
    middleName: user?.personalInfo?.middleName ?? "",
    lastName: user?.personalInfo?.lastName ?? "",
    suffix: user?.personalInfo?.suffix ?? "",
    ssnTin: user?.personalInfo?.ssnTin ?? "",
    dateOfBirth: user?.personalInfo?.dateOfBirth ? new Date(user.personalInfo.dateOfBirth) : undefined,
    phone: user?.personalInfo?.phone ?? "",
    email: user?.personalInfo?.email ?? "",
    addressLine1: user?.address?.addressLine1 ?? "",
    addressLine2: user?.address?.addressLine2 ?? "",
    city: user?.address?.city ?? "",
    state: user?.address?.state ?? "",
    zip: user?.address?.zip ?? "",
    residencyState: user?.address?.residencyState ?? "",
    isUSResident: user?.statusInfo?.isUSResident === true ? 'yes' : user?.statusInfo?.isUSResident === false ? 'no' : undefined,
    status: user?.statusInfo?.status ?? undefined,
    universityName: user?.statusInfo?.studentInfo?.universityName ?? "",
    employmentType: user?.statusInfo?.professionalInfo?.employmentType ?? undefined,
    companyName: user?.statusInfo?.professionalInfo?.companyName ?? "",
    freelanceYears: user?.statusInfo?.professionalInfo?.freelanceYears != null ? String(user.statusInfo.professionalInfo.freelanceYears) : "",
  } as z.infer<typeof formSchema>;
}

function mapFormToUserUpdates(values: z.infer<typeof formSchema>) {
  return {
    personalInfo: {
      firstName: values.firstName,
      middleName: values.middleName || undefined,
      lastName: values.lastName,
      suffix: values.suffix || undefined,
      ssnTin: values.ssnTin,
      dateOfBirth: values.dateOfBirth,
      phone: values.phone,
      email: values.email,
    },
    address: {
      addressLine1: values.addressLine1 || '',
      addressLine2: values.addressLine2 || '',
      city: values.city || '',
      state: values.state || '',
      zip: values.zip || '',
      residencyState: values.residencyState || '',
    },
    statusInfo: {
      isUSResident: values.isUSResident === 'yes' ? true : values.isUSResident === 'no' ? false : false,
      status: (values.status ?? 'student') as 'student' | 'professional',
      studentInfo: values.status === 'student' && values.universityName ? { universityName: values.universityName } : undefined,
      professionalInfo:
        values.status === 'professional'
          ? {
              employmentType: values.employmentType as 'employed' | 'freelancer' | undefined,
              companyName: values.companyName || undefined,
              freelanceYears: values.freelanceYears ? Number(values.freelanceYears) : undefined,
            }
          : undefined,
    },
  };
}
