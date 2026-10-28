<script setup>
import { computed, ref } from 'vue'
import { assetUrl } from '@/utils/asset'

const props = defineProps({
  project: { type: Object, required: true },
  to: { type: String, required: true },
})

const failed = ref(false)

const imageUrl = computed(() => (props.project.image ? assetUrl(props.project.image) : null))
</script>

<template>
    <RouterLink :to="to" class="project-card">
        <div class="cover">
            <img v-if="imageUrl && !failed" :src="imageUrl" :alt="project.brand" loading="lazy" @error="failed = true">
        </div>
        <div class="project-info flex-sb-baseline">
            <div class="index"> [{{ project.index }}]  </div>

            <div class="brand-name"> {{ project.brand }} </div>
        </div>
    </RouterLink>
</template>

<style scoped>
.project-info{
    gap: 16px;
}
.cover{
    aspect-ratio: 4/5;
    width: 100%;
    background-color: lightslategray;
}

.cover img{
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.index{
    font-size: 18px;
}
.brand-name{
    text-align: end;
    width: 100%;
    overflow: hidden;
    white-space: normal;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    padding-inline-end: 1ch;
    margin-inline-end: -1ch;
}
</style>