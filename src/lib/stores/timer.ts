import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { TimerState, TimerWarning } from '$lib/types';

// Timer store with pause/resume and warning system
function createTimerStore() {
	const defaultState: TimerState = {
		isRunning: false,
		isPaused: false,
		startTime: undefined,
		pausedTime: 0,
		remainingTime: undefined,
		warnings: []
	};

	const { subscribe, set, update } = writable<TimerState>(defaultState);
	let intervalId: NodeJS.Timeout | null = null;
	let warningIntervalId: NodeJS.Timeout | null = null;

	const createWarnings = (duration: number): TimerWarning[] => [
		{
			type: 'half',
			message: `You have ${Math.floor(duration / 2)} minutes remaining (halfway point)`,
			triggered: false
		},
		{
			type: 'quarter',
			message: `Warning: Only ${Math.floor(duration / 4)} minutes left!`,
			triggered: false
		},
		{
			type: 'final',
			message: 'Final warning: Less than 5 minutes remaining!',
			triggered: false
		},
		{
			type: 'overtime',
			message: 'Time is up! You can continue but your time will be recorded as overtime.',
			triggered: false
		}
	];

	const checkWarnings = (elapsed: number, totalDuration: number) => {
		if (!browser) return;

		const remaining = Math.max(0, totalDuration - elapsed);
		const halfTime = totalDuration / 2;
		const quarterTime = totalDuration / 4;
		const finalTime = 5 * 60 * 1000; // 5 minutes in ms

		update(state => {
			const newWarnings = state.warnings.map(warning => {
				if (warning.triggered) return warning;

				let shouldTrigger = false;

				switch (warning.type) {
					case 'half':
						shouldTrigger = remaining <= halfTime;
						break;
					case 'quarter':
						shouldTrigger = remaining <= quarterTime;
						break;
					case 'final':
						shouldTrigger = remaining <= finalTime;
						break;
					case 'overtime':
						shouldTrigger = remaining <= 0;
						break;
				}

				if (shouldTrigger) {
					// Trigger warning notification
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification('Quiz Timer', {
							body: warning.message,
							icon: '/favicon.png'
						});
					}

					// Optionally play sound or trigger other effects
					console.log('Timer warning:', warning.message);

					return { ...warning, triggered: true };
				}

				return warning;
			});

			return { ...state, warnings: newWarnings };
		});
	};

	const updateTimer = () => {
		update(state => {
			if (!state.isRunning || !state.startTime) return state;

			const now = Date.now();
			const elapsed = now - state.startTime.getTime() - state.pausedTime;
			const remaining = state.remainingTime ? Math.max(0, state.remainingTime - elapsed) : undefined;

			// Check for warnings if we have a time limit
			if (remaining !== undefined) {
				checkWarnings(elapsed, state.remainingTime!);
			}

			return {
				...state,
				remainingTime: remaining
			};
		});
	};

	return {
		subscribe,

		// Start timer with optional duration (in milliseconds)
		start: (duration?: number) => {
			if (intervalId) clearInterval(intervalId);
			if (warningIntervalId) clearInterval(warningIntervalId);

			update(state => ({
				...state,
				isRunning: true,
				isPaused: false,
				startTime: new Date(),
				pausedTime: 0,
				remainingTime: duration,
				warnings: duration ? createWarnings(duration) : []
			}));

			// Update timer every second
			intervalId = setInterval(updateTimer, 1000);
		},

		// Pause timer
		pause: () => {
			update(state => {
				if (!state.isRunning || state.isPaused) return state;

				if (intervalId) {
					clearInterval(intervalId);
					intervalId = null;
				}

				return {
					...state,
					isPaused: true
				};
			});
		},

		// Resume timer
		resume: () => {
			update(state => {
				if (!state.isRunning || !state.isPaused || !state.startTime) return state;

				const pauseStart = Date.now();
				const newPausedTime = state.pausedTime + (pauseStart - state.startTime.getTime());

				// Restart interval
				if (intervalId) clearInterval(intervalId);
				intervalId = setInterval(updateTimer, 1000);

				return {
					...state,
					isPaused: false,
					startTime: new Date(pauseStart - newPausedTime),
					pausedTime: 0
				};
			});
		},

		// Stop timer
		stop: () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			if (warningIntervalId) {
				clearInterval(warningIntervalId);
				warningIntervalId = null;
			}

			set(defaultState);
		},

		// Add time to current timer (for extensions)
		addTime: (milliseconds: number) => {
			update(state => ({
				...state,
				remainingTime: state.remainingTime ? state.remainingTime + milliseconds : undefined
			}));
		},

		// Get elapsed time
		getElapsed: () => {
			const state = get({ subscribe });
			if (!state.startTime) return 0;

			const now = Date.now();
			return now - state.startTime.getTime() - state.pausedTime;
		},

		// Get remaining time
		getRemaining: () => {
			const state = get({ subscribe });
			return state.remainingTime || 0;
		},

		// Check if time is up
		isTimeUp: () => {
			const state = get({ subscribe });
			if (!state.remainingTime) return false;

			const elapsed = state.startTime ? 
				Date.now() - state.startTime.getTime() - state.pausedTime : 0;
			return elapsed >= state.remainingTime;
		},

		// Request notification permission
		requestNotificationPermission: async () => {
			if (!browser || !('Notification' in window)) return false;

			if (Notification.permission === 'granted') return true;
			if (Notification.permission === 'denied') return false;

			const permission = await Notification.requestPermission();
			return permission === 'granted';
		},

		// Clear triggered warnings (useful for review mode)
		clearWarnings: () => {
			update(state => ({
				...state,
				warnings: state.warnings.map(w => ({ ...w, triggered: false }))
			}));
		}
	};
}

// Timer instance
export const timer = createTimerStore();

// Derived stores for formatted display
export const formattedTime = derived(
	timer,
	($timer) => {
		let timeToDisplay = 0;

		if ($timer.startTime && $timer.isRunning) {
			const elapsed = Date.now() - $timer.startTime.getTime() - $timer.pausedTime;
			timeToDisplay = $timer.remainingTime ? 
				Math.max(0, $timer.remainingTime - elapsed) : 
				elapsed;
		}

		const totalSeconds = Math.floor(timeToDisplay / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
);

export const timeProgress = derived(
	timer,
	($timer) => {
		if (!$timer.remainingTime || !$timer.startTime) return 0;

		const elapsed = Date.now() - $timer.startTime.getTime() - $timer.pausedTime;
		const progress = Math.min(100, (elapsed / $timer.remainingTime) * 100);
		return Math.max(0, progress);
	}
);

export const timeStatus = derived(
	timer,
	($timer) => {
		if (!$timer.isRunning) return 'stopped';
		if ($timer.isPaused) return 'paused';
		if ($timer.remainingTime) {
			const elapsed = $timer.startTime ? 
				Date.now() - $timer.startTime.getTime() - $timer.pausedTime : 0;
			if (elapsed >= $timer.remainingTime) return 'overtime';
		}
		return 'running';
	}
);

export const activeWarnings = derived(
	timer,
	($timer) => $timer.warnings.filter(w => w.triggered)
);

// Cleanup on page unload
if (browser) {
	window.addEventListener('beforeunload', () => {
		timer.stop();
	});
}