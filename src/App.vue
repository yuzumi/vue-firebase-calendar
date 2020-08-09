<template>
  <v-app>
    <v-main>
      <v-container>
        <calendar />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Calendar from '@/components/Calendar.vue';

export default {
  name: 'App',

  components: {
    Calendar,
  },
};
</script>
