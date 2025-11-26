// app/directives/can.ts
// /app/directives/can.ts
import type { DirectiveBinding, ObjectDirective } from 'vue'
import { watchEffect } from 'vue'
import { useUserStore } from '~/stores/user'

function evaluate(binding: DirectiveBinding): { keys: string[]; mode: 'hide' | 'disable' } {
  const raw = binding.value
  let keys: string[] = []

  if (Array.isArray(raw)) keys = raw.map(String)
  else if (typeof raw === 'string' && raw.trim()) keys = [raw.trim()]

  const mode: 'hide' | 'disable' = binding.modifiers?.disable ? 'disable' : 'hide'
  return { keys, mode }
}

function apply(el: HTMLElement, allowed: boolean, mode: 'hide' | 'disable') {
  if (mode === 'hide') {
    el.style.display = allowed ? '' : 'none'
    return
  }

  if (!allowed) {
    el.setAttribute('disabled', 'true')
    el.setAttribute('aria-disabled', 'true')
    el.classList.add('pointer-events-none', 'opacity-50')
  } else {
    el.removeAttribute('disabled')
    el.removeAttribute('aria-disabled')
    el.classList.remove('pointer-events-none', 'opacity-50')
  }
}

export const vCan: ObjectDirective = {
  mounted(el, binding) {
    const { keys, mode } = evaluate(binding)
    const store = useUserStore()

    watchEffect(() => {
      // 💡 accedemos al usuario para reactividad completa
      const _user = store.user
      const allowed = keys.length ? keys.some((key) => store.hasPermission(key)) : false
      apply(el as HTMLElement, allowed, mode)
    })
  },
}

export default vCan
