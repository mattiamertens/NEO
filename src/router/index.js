import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";

// `meta.section` decides which nav link is highlighted (see NavMenu.vue).
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: Home, meta: { section: 'home' } },
        { path: '/lab', name: 'lab', component: () => import('../views/Lab.vue'), meta: { section: 'lab' } },
        { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { section: 'about' } },
        { path: '/contact', name: 'contact', component: () => import('../views/Contacts.vue'), meta: { section: 'contact' } },
        { path: '/project/:slug', name: 'project', component: () => import('../views/Project.vue'), meta: { section: 'home' } },
        { path: '/lab/:slug', name: 'lab-project', component: () => import('../views/Project.vue'), meta: { section: 'lab' } },
    ],
})

export default router
