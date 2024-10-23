import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number]
	) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (
		style: Record<string, number | string | undefined>
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export const whichSprite = (index: number, count: number) => {
    switch (index) {
        case 0: return index
        case 1: return count < 5 ? 6 - count : index
        case 2:
            if (count < 6) return 8 - count
            if (count < 8) return 9 - count
            return index
        case 3:
            if (count < 8) return 10 - count
            return index
        case 4:
            if (count === 5) return 7
            if (count === 6) return 5
            if (count === 7) return 5
            return index
        case 5:
            if (count === 6) return 7
            if (count === 7) return 6
            return index
        case 6:
            if (count === 7) return 7
            return index
        case 7: return index
        default: return index
    }
}

export const calculatePositions = (count: number) => {
    const positions = []
    const center = 50
    const radius = 40
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI / count) * i + Math.PI / 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        positions.push({ x, y })
    }
    return positions
}