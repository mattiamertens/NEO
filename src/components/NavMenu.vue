<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const base = import.meta.env.BASE_URL

const links = [
    { to: '/', label: 'NEO', section: 'home' },
    { to: '/lab', label: 'LAB', section: 'lab' },
    { to: '/about', label: 'ABOUT', section: 'about' },
    { to: '/contact', label: 'CONTACT', section: 'contact' },
]

// Project pages carry their parent section in route meta, so NEO / LAB stay lit there too.
const route = useRoute()
const section = computed(() => route.meta.section)
</script>

<template>
    <nav>
        <div class="nav-links">
            <RouterLink
                v-for="link in links"
                :key="link.to"
                :to="link.to"
                :class="{ 'is-active': section === link.section }"
            >{{ link.label }}</RouterLink>
        </div>

        <img class="blob" :src="`${base}neo.svg`" alt="" />
    </nav>
</template>
