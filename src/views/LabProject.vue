<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { labProjects, labAsset } from '@/data/labProjects'
import ImageGrid from '@/components/ImageGrid.vue'

const route = useRoute()
const project = computed(() => labProjects.find((p) => p.slug === route.params.slug))

const heroUrl = computed(() => labAsset(project.value, project.value.hero || project.value.cover))
const galleryUrls = computed(() => project.value.gallery.map((file) => labAsset(project.value, file)))
</script>

<template>
  <div v-if="project" class="lab-project flex column">
    <div class="intro-grid">
      <div class="lab-text flex column g-16">
        <h1 class="lab-brand">{{ project.brand }}</h1>
        <p v-if="project.description" class="lab-description">{{ project.description }}</p>
      </div>

      <div class="lab-hero flex column g-16">
        <img :src="heroUrl" :alt="project.brand">
        <div class="lab-index">[{{ project.index }}]</div>
      </div>
    </div>

    <ImageGrid :images="galleryUrls" :alt="project.brand" />
  </div>

  <section v-else class="intro-grid">
    <h1 class="lab-brand">Project not found</h1>
    <RouterLink to="/lab" class="button-tertiary">← Back to Lab</RouterLink>
  </section>
</template>

<style scoped>
.lab-project{
  gap: 168px;
}

.lab-text{
    padding-inline-end: 24px;
}
.lab-brand{
    font-size: 22px;
    font-weight: 400;
}
.lab-description{
    max-width: 32ch;
    font-size: 14px;
    letter-spacing: -6%;
    color: var(--selected);
}

.lab-hero img{
  display: block;
  width: 100%;
  aspect-ratio: 4/5;
  object-fit: cover;
  background-color: lightslategray;
}
.lab-index{
  font-size: 18px;
}

@media (max-width: 768px) {
  .lab-project{
    align-items: start;
  }
  .intro-grid{
      grid-template-columns: 1fr;
      gap: 32px;
      padding: 32px 16px;
  }
}
</style>
