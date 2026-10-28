<script setup>
import { labProjects } from '@/data/labProjects'
import ProjectCard from '@/components/ProjectCard.vue'
</script>

<template>
  <div class="lab-grid">
    <ProjectCard
      v-for="p in labProjects"
      :key="p.slug"
      :project="p"
      :to="`/lab/${p.slug}`"
    />
  </div>
</template>
