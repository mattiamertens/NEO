<template>
  <div class="content-wrapper">
    <div class="intro-grid">
        <!-- FIRST COLUMN -->
        <div class="first-col flex-center-start column g-40 l-text">
          <img src="@/assets/about/about.webp" alt="Neo artificiale" style="width: 140px; height: 140px;">
    
          <div class="flex column" style="gap: 80px;">
            Neo is a duo of creatives focused on video production through generative artificial intelligence.  Our vision is to bring projects and ideas to life by embracing new creative possibilities.
            <div class="founders flex">
              <div class="person flex column g-40">
                <div style="height: 52px;">ENRICO MASSARO</div>
                <span class="unselected-text s-text">
                  Traditional film director and Generative AI specialist
                </span>
              </div>
    
              <div class="person flex column g-40">
                <div style="height: 52px;">LEONARDO MARTELLINI</div>
                <span class="unselected-text s-text">
                  Generative AI Specialist and Creative Director
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- SECOND COLUMN -->
        <div class="flex-center-center"></div>
        <!-- THIRD COLUMN -->
        <div class="collabs flex-end-end">
          <div class="partners flex column g-8 l-text">
            PARTNERS
            <div class="list-of-brands s-text unselected-text">
              Flora Fauna <br>
              Adobe <br>
              Higgsfield Dreamina
            </div>
          </div>
          <div class="clients flex column g-8 l-text">
            CLIENTS
            <div class="list-of-brands s-text unselected-text">
              L’oreal <br>
              seven <br>
              Rai <br>
              Burger king <br>
              formy studio <br>
              Dove <br>
              mediaset <br>
              molino vigevano <br>
              mediaset <br>
              dazn <br>
              nike <br>
              dolly noire <br>
              prada
            </div>
          </div>
        </div>
    </div>

  </div>


  <div class="team-section">
    <div class="team-title l-text">OUR TEAM ↓</div>
    <div class="team-list flex column">
      <TeamCard v-for="m in team" :key="m.name" :member="m" />
    </div>
  </div>
</template>

<script setup>
import TeamCard from '@/components/TeamCard.vue'
import { team } from '@/data/team'
</script>

<style scoped>
  .g-40{
    gap: 40px;
  }

  .list-of-brands{
    text-transform: uppercase;
  }
  .content-wrapper{
    height: calc(100vh - 148px);
    display: flex;
    align-items: center;
  }

  .intro-grid{
    height: fit-content;
  }
  .intro-grid > div{
    height: 100%;
  }

  .collabs{
    gap: 32px;
  }

  .founders{
    gap: 32px;
  }
  .founders > .person{
    flex: 1 1 0;
    min-width: 0;
  }

  .team-section{
    padding: 0 72px;
  }

  .team-list{
    gap: 72px;
    padding: 88px 0;
  }
</style>