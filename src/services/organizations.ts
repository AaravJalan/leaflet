import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { slugify } from '../lib/slug'
import type { Organization, OrgType } from '../types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function mapOrg(id: string, data: Record<string, unknown>): Organization {
  return {
    id,
    name: String(data.name || ''),
    slug: String(data.slug || ''),
    description: String(data.description || ''),
    type: (data.type as Organization['type']) || 'Other',
    ownerId: String(data.ownerId || ''),
    ownerName: String(data.ownerName || ''),
    location: String(data.location || ''),
    createdAt: Number(data.createdAt || 0),
  }
}

export async function createOrganization(input: {
  name: string
  description: string
  type: OrgType
  ownerId: string
  ownerName: string
  location?: string
}): Promise<string> {
  const database = requireDb()
  const ref = await addDoc(collection(database, 'organizations'), {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description.trim(),
    type: input.type,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    location: (input.location || '').trim(),
    createdAt: Date.now(),
  })
  return ref.id
}

export async function updateOrganization(
  id: string,
  input: { name: string; description: string; type: OrgType; location: string },
): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'organizations', id), {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description.trim(),
    type: input.type,
    location: input.location.trim(),
  })
}

export async function deleteOrganization(id: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'organizations', id))
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'organizations', id))
  return snap.exists() ? mapOrg(snap.id, snap.data()) : null
}

export async function listOrganizations(filters?: {
  type?: OrgType | 'All'
  search?: string
}): Promise<Organization[]> {
  const database = requireDb()
  const orgsRef = collection(database, 'organizations')
  const q =
    filters?.type && filters.type !== 'All'
      ? query(orgsRef, where('type', '==', filters.type), orderBy('name'))
      : query(orgsRef, orderBy('name'))

  const snap = await getDocs(q)
  let orgs = snap.docs.map((d) => mapOrg(d.id, d.data()))

  const search = filters?.search?.trim().toLowerCase()
  if (search) {
    orgs = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.description.toLowerCase().includes(search),
    )
  }

  return orgs
}

export async function listOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'organizations'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOrg(d.id, d.data()))
}
