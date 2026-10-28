<script setup>
import { computed, ref } from 'vue'
import { assetUrl } from '@/utils/asset'

const props = defineProps({
  member: { type: Object, required: true },
})

const failed = ref(false)

const photoUrl = computed(() => (props.member.photo ? assetUrl(props.member.photo) : null))
</script>

<template>
    <div class="team-card flex column">
        <div class="top flex">
            <div class="photo">
                <img v-if="photoUrl && !failed" :src="photoUrl" :alt="member.name" loading="lazy" @error="failed = true">
            </div>

            <div class="info flex column">
                <div class="role l-text">{{ member.role }}</div>
                <div class="contacts flex column s-text unselected-text">
                    <a v-if="member.instagram" :href="`https://instagram.com/${member.instagram}`" target="_blank" rel="noopener">@{{ member.instagram }}</a>
                    <a v-if="member.email" :href="`mailto:${member.email}`">{{ member.email }}</a>
                </div>
            </div>
        </div>

        <div class="caption xs-text">[{{ member.index }}]&nbsp;&nbsp;{{ member.name }}</div>
    </div>
</template>

<style scoped>
.team-card{
    gap: 16px;
}

.top{
    align-items: flex-end;
    gap: 50px;
}

.photo{
    aspect-ratio: 1;
    width: 192px;
    flex-shrink: 0;
    background-color: lightslategray;
}
.photo img{
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.caption{
    white-space: nowrap;
}

.info{
    gap: 24px;
}
.role{
    text-transform: uppercase;
}
.contacts{
    font-style: italic;
}
.contacts a{
    color: inherit;
    text-decoration: none;
}
.contacts a:hover{
    text-decoration: underline;
}
</style>
