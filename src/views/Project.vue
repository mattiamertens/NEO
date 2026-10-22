<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { projects } from '@/data/projects'

const route = useRoute()
const project = computed(() => projects.find((p) => p.slug === route.params.slug))
</script>

<template>
  <section v-if="project">
    <h1>[ {{ project.index }} ] {{ project.brand }}</h1>
  </section>
  <section v-else>
    <h1>Project not found</h1>
  </section>
</template>
