<template>
  <div>
    <div class="loader" v-if="loading">Loading...</div>

    <div class="alert" v-if="errorMessage">errorMessage</div>

    <div id="dashboard-container">
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {ICCubeDashboardsLoader} from '../service/ICCubeDashboardsLoader';

const props = defineProps({
    dashboardPath: {
        type: String,
        required: true,
    },
});

const errorMessage = ref('');
const loading = ref(true);

onMounted(() => {
    // init ICCubeDashboardsLoader
    const loader = new ICCubeDashboardsLoader({
        debug: true,
        customHeadersType: 'dashboards',
        customHeaders: {
            'ic3_user_name': 'admin',
            'ic3_role_name': 'administrator',
        },
        container: document.getElementById('dashboard-container'),
    });

    // load dashboard
    loader.initialize().then((reporting) => {
        reporting.openReport({
            path: props.dashboardPath,
            params: [],
            configuration: {
                userName: 'demo',
                userPassword: 'demo',
                userNameCheck: false,
            },

            onDefinition: (report) => {
                console.log('[ic3-demo] open-report:' + report.getPath() + ' - onDefinition', report);
                loading.value = false;
            },

            onError: (error) => {
                console.log('[ic3-demo] open-report:' + props.dashboardPath + ' - onError', error);
                loading.value = false;
                return true /* handled */;
            },
        });
    }).catch((error) => {
        errorMessage.value = error;
        loading.value = false;
    });
});

</script>

<style lang="scss" scoped>
@import '../styles.scss';

#dashboard-container {
    width: 100%;
}
</style>
