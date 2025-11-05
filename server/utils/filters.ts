// server/utils/filters.ts
import type { SelectQueryBuilder } from 'kysely'
import { sql } from 'kysely'
import type { DB } from '../database/types'
import { createError } from 'h3'

export interface FilterOptions {
  search?: string
  status?: string
  page?: number
  pageSize?: number
  statusColumn?: string
  // Custom search applier (for COALESCE across translations)
  applySearch?: <TB2 extends keyof DB, O2>(
    qb: SelectQueryBuilder<DB, TB2, O2>,
    search: string,
  ) => SelectQueryBuilder<DB, TB2, O2>
  // Back-compat simple search list over columns
  searchColumns?: string[]
  // Sorting
  sort?: { field?: string; direction?: 'asc' | 'desc' }
  // Support string column names or raw SQL expressions (e.g., sql`lower(...)`)
  sortColumnMap?: Record<string, unknown>
  defaultSort?: { field: string; direction?: 'asc' | 'desc' }
  // Counting
  countDistinct?: string // e.g. 'a.id'
}

export async function buildFilters<TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  options: FilterOptions,
): Promise<{
  query: SelectQueryBuilder<DB, TB, O>
  page: number
  pageSize: number
  totalItems: number
  resolvedSortField?: string
  resolvedSortDirection?: 'asc' | 'desc'
}> {
  // 🔸 Normaliza alias de búsqueda (?search= o ?q=)
  const normalizedSearchRaw = (options.search ?? (options as any).q ?? '').toString().trim()
  const search = normalizedSearchRaw.length > 0 ? normalizedSearchRaw : ''
  options.search = search

  // 🔸 Paginación segura
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(Math.max(1, Number(options.pageSize) || 20), 100)
  const status = (options.status ?? '').trim() || undefined

  let filtered = qb

  // 🔸 Filtro de status (si procede)
  if (status && options.statusColumn) {
    filtered = filtered.where(
      options.statusColumn as unknown as never,
      '=',
      status as unknown as never,
    )
  }

  // 🔸 Filtro de búsqueda (custom o genérico)
  if (search) {
    if (options.applySearch) {
      filtered = options.applySearch(filtered, search)
    } else if (options.searchColumns && options.searchColumns.length > 0) {
      filtered = filtered.where((eb) =>
        eb.or(
          options.searchColumns.map((col) =>
            eb(col as unknown as never, 'ilike', `%${search}%`),
          ),
        ),
      )
    }
  }

  // 🔸 Conteo total (distinct o completo)
  let countQb = filtered.clearSelect().clearOrderBy()
  if (options.countDistinct) {
    countQb = countQb.select(() =>
      sql<number>`count(distinct ${sql.ref(options.countDistinct!)})`.as('count'),
    )
  } else {
    countQb = countQb.select((eb) => eb.fn.countAll().as('count'))
  }

  const countRow = await countQb.executeTakeFirst()
  const totalItems = Number((countRow as unknown as { count?: string })?.count ?? 0)

  // 🔸 Sorting validado con whitelist
  const allowedSortFields = Object.keys(options.sortColumnMap || {})
  const sortFieldInput = options.sort?.field
  const sortFieldValid = allowedSortFields.includes(sortFieldInput ?? '')
    ? sortFieldInput
    : options.defaultSort?.field

  const sortDir: 'asc' | 'desc' =
    options.sort?.direction === 'asc' || options.sort?.direction === 'desc'
      ? options.sort.direction
      : options.defaultSort?.direction ?? 'desc'

  const sortColumn =
    sortFieldValid && options.sortColumnMap?.[sortFieldValid]

  if (sortFieldInput && !allowedSortFields.includes(sortFieldInput)) {
    // Campo inválido: lanza error limpio
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid sort field '${sortFieldInput}'. Allowed: ${allowedSortFields.join(', ')}`,
    })
  }

  if (sortColumn) {
    filtered = filtered.orderBy(sortColumn as unknown as never, sortDir)
  }

  // 🔸 Paginación
  const offset = (page - 1) * pageSize
  const query = filtered.offset(offset).limit(pageSize)

  return {
    query,
    page,
    pageSize,
    totalItems,
    resolvedSortField: sortFieldValid,
    resolvedSortDirection: sortDir,
  }
}

