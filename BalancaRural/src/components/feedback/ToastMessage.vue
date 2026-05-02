<script setup>
defineProps({
  message: {
    type: String,
    default: ""
  }
});
</script>

<template>
  <div v-if="message" class="toast">{{ message }}</div>
</template>
