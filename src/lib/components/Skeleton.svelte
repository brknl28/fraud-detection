<script lang="ts">
    interface Props {
        variant?: "image" | "text" | "rect";
        width?: string;
        height?: string;
        borderRadius?: string;
    }

    let {
        variant = "rect",
        width = "100%",
        height = "1rem",
        borderRadius = "4px",
    }: Props = $props();

    const defaultDimensions = {
        image: { width: "100%", height: "300px", borderRadius: "8px" },
        text: { width: "100%", height: "1rem", borderRadius: "4px" },
        rect: { width: "100%", height: "100%", borderRadius: "4px" },
    };

    const finalWidth = $derived(width || defaultDimensions[variant].width);
    const finalHeight = $derived(height || defaultDimensions[variant].height);
    const finalRadius = $derived(
        borderRadius || defaultDimensions[variant].borderRadius,
    );
</script>

<div
    class="skeleton skeleton-{variant}"
    style:width={finalWidth}
    style:height={finalHeight}
    style:border-radius={finalRadius}
    aria-hidden="true"
></div>
