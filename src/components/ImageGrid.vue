<script setup>
// Full-bleed 2-column gallery. Takes already-resolved URLs, so any page can reuse it.
// With an odd number of images the last one spans the full width.
defineProps({
  images: { type: Array, required: true },
  alt: { type: String, default: '' },
})
</script>

<template>
    <div v-if="images.length" class="image-grid">
        <img
            v-for="(src, i) in images"
            :key="src"
            :src="src"
            :alt="`${alt} ${i + 1}`"
            loading="lazy"
        >
    </div>
</template>

<style scoped>
.image-grid{
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.image-grid img{
    display: block;
    width: 100%;
    aspect-ratio: 4/5;
    object-fit: cover;
    background-color: lightslategray;
}
.image-grid img:last-child:nth-child(odd){
    /* grid-column: 1 / -1;
    aspect-ratio: 8/5; */
}

@media (max-width: 768px) {
    .image-grid { grid-template-columns: 1fr; }
    
    /* .image-grid img:last-child:nth-child(odd) { aspect-ratio: 4/5; } */
}
</style>
