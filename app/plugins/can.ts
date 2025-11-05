// app/plugins/can.ts
import { defineNuxtPlugin } from '#app'
import vCan from '@/directives/can'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('can', vCan)
})
