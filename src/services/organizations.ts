import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { slugify } from '../lib/slug'
import type { Organization, OrgType } from '../types'
import { upsertOrgMember } from './members'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured.')
  return db
}

function mapOrg(id: string, data: Record<string, unknown>): Organization {
  return { id, ...(data as Omit<Organization, 'id'>) }
}

export async function createOrganization(input: {
  name: string
  description: string
  type: OrgType
  ownerId: string
  ownerName: string
  ownerEmail?: string
}): Promise<string> {
  const database = requireDb()
  const ref = await addDoc(collection(database, 'organizations'), {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description.trim(),
    type: input.type,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    createdAt: Date.now(),
    verified: true,
  })

  await upsertOrgMember({
    orgId: ref.id,
    userId: input.ownerId,
    email: (input.ownerEmail || '').toLowerCase(),
    displayName: input.ownerName,
    role: 'owner',
    addedBy: input.ownerId,
    createdAt: Date.now(),
  })

  return ref.id
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
