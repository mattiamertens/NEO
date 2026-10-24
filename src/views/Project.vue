<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { projects, labProjects } from '@/data/projects'

const route = useRoute()
const list = computed(() => (route.meta.section === 'lab' ? labProjects : projects))
const project = computed(() => list.value.find((p) => p.slug === route.params.slug))
</script>

<template>
  <section v-if="project">
    <h1>[ {{ project.index }} ] {{ project.brand }}</h1>
  </section>
  <section v-else>
    <h1>Project not found</h1>
  </section>
</template>
