<!-- app/pages/deck/index.vue -->
<template>
    <div class="max-w-4xl mx-auto">
      <UCard>
        <h1><v-text-field
          v-model="value"
          name="name"
          :rules="[(v) => v.length <= 25 || 'Max 25 characters']"
          :counter="25"
        /></h1>
      </UCard>
    </div>
</template>

