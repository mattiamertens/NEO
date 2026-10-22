<script setup>
const base = import.meta.env.BASE_URL
</script>

<template>
    <nav>
        <div class="nav-links">
            <RouterLink to="/">NEO</RouterLink>
            <RouterLink to="/lab">LAB</RouterLink>
            <RouterLink to="/about">ABOUT</RouterLink>
            <RouterLink to="/contact">CONTACT</RouterLink>
        </div>
        
        <img class="blob" :src="`${base}neo.svg`" alt="" />
    </nav>
</template>