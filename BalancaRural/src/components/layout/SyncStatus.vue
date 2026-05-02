<script setup>
defineProps({
  enabled: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ""
  }
});
</script>

<template>
  <div class="sync-status" :class="enabled ? 'online' : 'offline'">
    <span></span>
    {{ message }}
  </div>
</template>
