import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Colors
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

export default defineNuxtPlugin((app) => {
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        Title,
        Tooltip,
        Legend,
        Colors
    );
    app.vueApp.component('Line', Line);
    app.vueApp.component('Bar', Bar);
});
