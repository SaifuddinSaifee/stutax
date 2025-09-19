import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList, PDFRadioGroup, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export type PdfFieldDescriptor = {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'optionlist' | 'unknown';
  value?: string | boolean | string[] | undefined;
};

export async function loadPdfFromDisk(relativePathFromRoot: string) {
  const abs = path.join(process.cwd(), relativePathFromRoot);
  const bytes = await fs.readFile(abs);
  const pdf = await PDFDocument.load(bytes);
  return pdf;
}

export async function listAcroFormFields(pdf: PDFDocument): Promise<PdfFieldDescriptor[]> {
  const form = pdf.getForm();
  const fields = form.getFields();
  return fields.map((f) => {
    const type = f.constructor.name;
    let kind: PdfFieldDescriptor['type'] = 'unknown';
    let value: PdfFieldDescriptor['value'];
    if (type === PDFTextField.name) {
      kind = 'text';
      value = (f as PDFTextField).getText();
    } else if (type === PDFCheckBox.name) {
      kind = 'checkbox';
      value = (f as PDFCheckBox).isChecked();
    } else if (type === PDFRadioGroup.name) {
      kind = 'radio';
      value = (f as PDFRadioGroup).getSelected();
    } else if (type === PDFDropdown.name) {
      kind = 'dropdown';
      value = (f as PDFDropdown).getSelected();
      // dropdown getSelected returns string[]; convert to string for common case of single select
      if (Array.isArray(value)) {
        value = value.length <= 1 ? value[0] : value;
      }
    } else if (type === PDFOptionList.name) {
      kind = 'optionlist';
      value = (f as PDFOptionList).getSelected();
    }
    return { name: f.getName(), type: kind, value };
  });
}

/**
 * Fill a PDF form based on a simple key-value map.
 * - text fields: string
 * - checkbox: boolean
 * - radio: string (option name)
 */
export async function fillPdfFields(
  pdf: PDFDocument,
  values: Record<string, unknown>
): Promise<Uint8Array> {
  const form = pdf.getForm();
  for (const [key, raw] of Object.entries(values)) {
    const field = form.getFieldMaybe(key);
    if (!field) continue;
    const ctor = field.constructor.name;
    try {
      if (ctor === PDFTextField.name) {
        (field as PDFTextField).setText(String(raw ?? ''));
      } else if (ctor === PDFCheckBox.name) {
        const checked = Boolean(raw);
        if (checked) (field as PDFCheckBox).check();
        else (field as PDFCheckBox).uncheck();
      } else if (ctor === PDFRadioGroup.name) {
        if (typeof raw === 'string') (field as PDFRadioGroup).select(raw);
      } else if (ctor === PDFDropdown.name) {
        if (typeof raw === 'string') (field as PDFDropdown).select(raw);
      } else if (ctor === PDFOptionList.name) {
        if (Array.isArray(raw)) {
          for (const val of raw as unknown[]) {
            (field as PDFOptionList).select(String(val));
          }
        } else if (typeof raw === 'string') {
          (field as PDFOptionList).select(raw);
        }
      }
    } catch {}
  }

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);
  form.flatten();
  return await pdf.save();
}


