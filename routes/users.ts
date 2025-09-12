import { getDb } from '@/mongodb';
import { ObjectId, type WithId } from 'mongodb';
import type { User, UserFormData } from '@/lib/interfaces/user';

const COLLECTION_NAME = 'users';

export type MinimalRegistrationData = {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string | Date;
  email: string;
};

export type NewUserInput = UserFormData | MinimalRegistrationData;

export async function addUser(userData: NewUserInput): Promise<User> {
  const db = await getDb();
  const now = new Date();

  const docBase: Omit<User, '_id'> = 'personalInfo' in (userData as any)
    ? {
        ...(userData as UserFormData),
        createdAt: now,
        updatedAt: now,
      }
    : {
        personalInfo: {
          firstName: (userData as MinimalRegistrationData).firstName,
          middleName: (userData as MinimalRegistrationData).middleName,
          lastName: (userData as MinimalRegistrationData).lastName,
          suffix: (userData as MinimalRegistrationData).suffix,
          ssnTin: '',
          dateOfBirth: new Date((userData as MinimalRegistrationData).dateOfBirth),
          phone: '',
          email: (userData as MinimalRegistrationData).email,
        },
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          residencyState: '',
        },
        statusInfo: {
          isUSResident: false,
          status: 'student',
        },
        createdAt: now,
        updatedAt: now,
      };

  const result = await db.collection<Omit<User, '_id'>>(COLLECTION_NAME).insertOne(docBase);
  return { _id: result.insertedId.toString(), ...docBase } as User;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const found = await db
    .collection<Omit<User, '_id'>>(COLLECTION_NAME)
    .findOne({ 'personalInfo.email': email } as Partial<Record<string, unknown>>);
  if (!found) return null;
  // `found` here does not include _id due to collection type; re-fetch with WithId
  const foundWithId = (await db
    .collection(COLLECTION_NAME)
    .findOne({ 'personalInfo.email': email })) as WithId<Omit<User, '_id'>> | null;
  if (!foundWithId) return null;
  const { _id, ...rest } = foundWithId;
  return { _id: _id.toString(), ...(rest as Omit<User, '_id'>) } as User;
}

export async function updateUserById(id: string, updates: Partial<UserFormData>): Promise<User | null> {
  const db = await getDb();
  if (!ObjectId.isValid(id)) return null;
  const _id = new ObjectId(id);
  const toSet: Partial<UserFormData> & { updatedAt: Date } = { ...updates, updatedAt: new Date() };
  const updateRes = await db.collection(COLLECTION_NAME).updateOne({ _id }, { $set: toSet });
  if (updateRes.matchedCount === 0) return null;
  const updated = (await db.collection(COLLECTION_NAME).findOne({ _id })) as WithId<Omit<User, '_id'>> | null;
  if (!updated) return null;
  const { _id: outId, ...rest } = updated;
  return { _id: outId.toString(), ...(rest as Omit<User, '_id'>) } as User;
}


