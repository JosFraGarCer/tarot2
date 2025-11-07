import { $fetch as ofetch } from 'ofetch'

export const useApiFetch = ofetch.create({
  baseURL: '/api',
  credentials: 'include',
})
