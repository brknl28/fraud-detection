<script lang="ts">
    import { documentStore } from "$lib/stores/document.svelte";
    import {
        AlertTriangle,
        ShieldAlert,
        ShieldCheck,
        Info,
    } from "lucide-svelte";
    import { fly } from "svelte/transition";

    let yellowCount = $derived(
        documentStore.anomalies.filter((a) => a.type === "original").length,
    );
    let redCount = $derived(
        documentStore.anomalies.filter((a) => a.type === "forged").length,
    );
    let totalAnomalies = $derived(yellowCount + redCount);

    let score = $derived(documentStore.fraudScore);
    let status = $derived(documentStore.authenticityStatus);

    let isExpanded = $state(false);

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    function getStatusColor(s: string) {
        if (s === "SAFE") return "#22c55e";
        if (s === "CAUTION") return "#eab308";
        return "#ef4444";
    }

    function getStatusText(s: string) {
        if (s === "SAFE") return "Sicher";
        if (s === "CAUTION") return "Vorsicht";
        return "Kritisch";
    }
</script>

<div
    class="anomaly-card"
    role="button"
    tabindex="0"
    onclick={toggleExpand}
    onkeydown={(e) =>
        (e.key === "Enter" || e.key === " ") &&
        (e.preventDefault(), toggleExpand())}
    aria-label="Vertrauenswertung - {score} Punkte, {getStatusText(status)}"
>
    <div class="card-header">
        <div class="score-ring" style="--score-color: {getStatusColor(status)}">
            <svg viewBox="0 0 36 36" class="circular-chart">
                <path
                    class="circle-bg"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                    class="circle"
                    stroke-dasharray="{score}, 100"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />
            </svg>
            <span class="score-text">{score}</span>
        </div>

        <div class="header-info">
            <div class="status-title" style="color: {getStatusColor(status)}">
                {getStatusText(status)}
            </div>
            <div class="status-subtitle">Vertrauenswert</div>
        </div>
    </div>
</div>
