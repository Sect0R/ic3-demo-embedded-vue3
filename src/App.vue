<template>
  <div class="navigation">
    <button @click="mode = 'div'">DIV</button>
    <button @click="mode = 'iFrameAdmin'">Admin iFrame</button>
    <button @click="mode = 'iFrameDashboard'">Dashboard iFrame</button>
  </div>
  <div class="content">
    <h2 v-if="!mode">Choose one of the options</h2>

    <ic3-div v-if="mode === 'div'" :dashboardPath="dashboardPath" />
    <ic3-i-frame v-if="mode === 'iFrameAdmin'" />
    <ic3-i-frame v-if="mode === 'iFrameDashboard'" :dashboardPath="dashboardPath" />
  </div>
</template>

<script setup>
import {ref} from 'vue';
import Ic3Div from './components/ic3Div.vue';
import Ic3IFrame from './components/ic3IFrame.vue';

const mode = ref(null);

const dashboardPath = 'users:/admin/demo';
</script>

<style lang="scss" scoped>
@import './styles.scss';

.navigation {
  display: flex;
  flex-direction: row;
  align-content: flex-start;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  -webkit-box-shadow: 0 7px 8px 0 rgba(34, 60, 80, 0.2);
  -moz-box-shadow: 0 7px 8px 0 rgba(34, 60, 80, 0.2);
  box-shadow: 0 7px 8px 0 rgba(34, 60, 80, 0.2);
  padding-bottom: 10px;

  button {
    background-color: #1652F0;
    border: 1px solid #1652F0;
    border-radius: 4px;
    box-sizing: border-box;
    color: #FFFFFF;
    cursor: pointer;
    line-height: 1.15;
    padding: 12px 16px;
    text-align: center;
    width: fit-content;
  }
}

.content {
  text-align: center;
}
</style>
