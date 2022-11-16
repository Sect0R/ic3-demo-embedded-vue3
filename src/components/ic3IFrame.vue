<template>
    <div id="iccube-container"></div>
</template>

<script setup>
import {onMounted} from 'vue';
import {DashboardsLoaderFrame, ICCubeDashboardsLoader} from '../service/ICCubeDashboardsLoader';

const props = defineProps({
    dashboardPath: {
        type: String,
        required: false,
    },
});

onMounted(() => {
    const loader = new ICCubeDashboardsLoader({
        customHeadersType: 'dashboards',
        customHeaders: {
            'ic3_user_name': 'admin',
            'ic3_role_name': 'administrator',
        },
    });

    loader.initializeCustomHeaders();

    DashboardsLoaderFrame({
        containerId: 'iccube-container',
        url: !props.dashboardPath ? '/icCube/console/builder' : '/icCube/report/viewer?ic3report='+ props.dashboardPath,
    });
});


</script>

<style lang="scss">
@import '../styles.scss';

#iccube-container {
  min-height: 90vh;
  width: 100%;

  iframe {
    min-height: 90vh;
  }
}
</style>
