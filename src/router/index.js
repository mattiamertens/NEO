import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', name: 'home', component: Home},
        { path: '/lab', name: 'lab', component: () => import('../views/Lab.vue') },
        { path: '/about', name: 'about', component: () => import('../views/About.vue') },
        { path: '/contact', name: 'contact', component: () => import('../views/Contacts.vue') },
        { path: '/project/:slug', name: 'project', component: () => import('../views/Project.vue') },
    ],
})

export default router