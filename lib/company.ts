// Sistema de gestión de empresas con almacenamiento local

export interface Company {
  id: string
  nombre: string
  nit?: string
  direccion?: string
  telefono?: string
  fechaCreacion: string
}

const COMPANIES_KEY = "companies"
const SELECTED_COMPANY_KEY = "selected_company"

export function getCompanies(): Company[] {
  if (typeof window === "undefined") return []

  const companiesStr = localStorage.getItem(COMPANIES_KEY)
  if (!companiesStr) return []

  try {
    return JSON.parse(companiesStr)
  } catch {
    return []
  }
}

export function saveCompanies(companies: Company[]): void {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies))
}

export function addCompany(companyData: Omit<Company, "id" | "fechaCreacion">): Company {
  const companies = getCompanies()
  const newCompany: Company = {
    ...companyData,
    id: crypto.randomUUID(),
    fechaCreacion: new Date().toISOString(),
  }

  companies.push(newCompany)
  saveCompanies(companies)

  // Si es la primera empresa, seleccionarla automáticamente
  if (companies.length === 1) {
    setSelectedCompany(newCompany.id)
  }

  return newCompany
}

export function updateCompany(id: string, updates: Partial<Omit<Company, "id" | "fechaCreacion">>): boolean {
  const companies = getCompanies()
  const index = companies.findIndex((c) => c.id === id)

  if (index === -1) return false

  companies[index] = { ...companies[index], ...updates }
  saveCompanies(companies)
  return true
}

export function deleteCompany(id: string): boolean {
  const companies = getCompanies()
  const filteredCompanies = companies.filter((c) => c.id !== id)

  if (filteredCompanies.length === companies.length) return false

  saveCompanies(filteredCompanies)

  // Si se eliminó la empresa seleccionada, limpiar la selección
  if (getSelectedCompanyId() === id) {
    localStorage.removeItem(SELECTED_COMPANY_KEY)
  }

  return true
}

export function setSelectedCompany(companyId: string): void {
  localStorage.setItem(SELECTED_COMPANY_KEY, companyId)
}

export function getSelectedCompanyId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SELECTED_COMPANY_KEY)
}

export function getSelectedCompany(): Company | null {
  const id = getSelectedCompanyId()
  if (!id) return null

  const companies = getCompanies()
  return companies.find((c) => c.id === id) || null
}
