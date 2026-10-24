<script setup>
import { labProjects } from '@/data/projects'
</script>

<template>
  <h1>LAB</h1>
  <!-- Placeholder list until the Lab layout is designed. -->
  <ul>
    <li v-for="p in labProjects" :key="p.slug">
      <RouterLink :to="`/lab/${p.slug}`">[ {{ p.index }} ] {{ p.brand }}</RouterLink>
    </li>
  </ul>
</template>
