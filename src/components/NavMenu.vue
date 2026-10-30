<script setup>
import { computed, ref, watch } from 'vue'
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

// Mobile pop-up menu: closes itself whenever the route changes.
const open = ref(false)
watch(() => route.fullPath, () => { open.value = false })
</script>

<template>
    <nav :class="{ 'is-open': open }">
        <button
            class="menu-toggle l-text unselected-text"
            type="button"
            :aria-expanded="open"
            @click="open = !open"
        >{{ open ? 'CLOSE' : 'MENU' }}</button>

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
