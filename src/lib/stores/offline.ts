import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { OfflineState, PendingAction, StorageError } from '$lib/types';

// Offline state management with sync and recovery
function createOfflineStore() {
	const defaultState: OfflineState = {
		isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
		pendingActions: [],
		lastSyncTime: undefined
	};

	const { subscribe, set, update } = writable<OfflineState>(defaultState);
	const errors = writable<StorageError[]>([]);
	
	let syncInterval: NodeJS.Timeout | null = null;
	let retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

	// Generate unique ID for actions
	const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	// Save offline state to localStorage
	const saveOfflineState = (state: OfflineState) => {
		if (!browser) return;
		
		try {
			const serializedState = {
				...state,
				pendingActions: state.pendingActions.map(action => ({
					...action,
					timestamp: action.timestamp.toISOString()
				})),
				lastSyncTime: state.lastSyncTime?.toISOString()
			};
			
			localStorage.setItem('offline-state', JSON.stringify(serializedState));
		} catch (error) {
			console.error('Failed to save offline state:', error);
		}
	};

	// Load offline state from localStorage
	const loadOfflineState = (): OfflineState => {
		if (!browser) return defaultState;
		
		try {
			const stored = localStorage.getItem('offline-state');
			if (!stored) return defaultState;
			
			const parsed = JSON.parse(stored);
			return {
				...parsed,
				isOnline: navigator.onLine,
				pendingActions: parsed.pendingActions.map((action: any) => ({
					...action,
					timestamp: new Date(action.timestamp)
				})),
				lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : undefined
			};
		} catch (error) {
			console.error('Failed to load offline state:', error);
			return defaultState;
		}
	};

	// Process a single pending action
	const processPendingAction = async (action: PendingAction): Promise<boolean> => {
		try {
			// Here you would normally send to server or process the action
			// For this example, we'll simulate processing by checking if it's valid
			
			switch (action.type) {
				case 'answer':
					// Process answer update
					console.log('Processing answer action:', action.data);
					break;
				case 'flag':
					// Process flag update
					console.log('Processing flag action:', action.data);
					break;
				case 'navigation':
					// Process navigation tracking
					console.log('Processing navigation action:', action.data);
					break;
				case 'submit':
					// Process quiz submission
					console.log('Processing submit action:', action.data);
					break;
				default:
					throw new Error(`Unknown action type: ${action.type}`);
			}

			return true;
		} catch (error) {
			console.error('Failed to process action:', action.id, error);
			return false;
		}
	};

	// Retry failed actions with exponential backoff
	const scheduleRetry = (action: PendingAction) => {
		if (action.retryCount >= 3) {
			// Max retries reached, move to failed actions or discard
			console.warn('Max retries reached for action:', action.id);
			return;
		}

		const delay = Math.min(1000 * Math.pow(2, action.retryCount), 30000); // Cap at 30 seconds
		
		const timeout = setTimeout(async () => {
			const success = await processPendingAction(action);
			
			if (success) {
				update(state => ({
					...state,
					pendingActions: state.pendingActions.filter(a => a.id !== action.id)
				}));
				retryTimeouts.delete(action.id);
			} else {
				// Increment retry count and schedule another retry
				update(state => ({
					...state,
					pendingActions: state.pendingActions.map(a => 
						a.id === action.id ? { ...a, retryCount: a.retryCount + 1 } : a
					)
				}));
				scheduleRetry({ ...action, retryCount: action.retryCount + 1 });
			}
		}, delay);

		retryTimeouts.set(action.id, timeout);
	};

	// Sync all pending actions
	const syncPendingActions = async () => {
		const state = get({ subscribe });
		if (!state.isOnline || state.pendingActions.length === 0) return;

		console.log(`Syncing ${state.pendingActions.length} pending actions...`);

		const results = await Promise.allSettled(
			state.pendingActions.map(action => processPendingAction(action))
		);

		update(currentState => {
			const successfulActions = new Set<string>();
			const failedActions: PendingAction[] = [];

			results.forEach((result, index) => {
				const action = currentState.pendingActions[index];
				if (result.status === 'fulfilled' && result.value === true) {
					successfulActions.add(action.id);
				} else {
					failedActions.push(action);
				}
			});

			// Remove successful actions and schedule retries for failed ones
			failedActions.forEach(action => scheduleRetry(action));

			const newState = {
				...currentState,
				pendingActions: currentState.pendingActions.filter(
					action => !successfulActions.has(action.id)
				),
				lastSyncTime: new Date()
			};

			saveOfflineState(newState);
			return newState;
		});
	};

	// Initialize online/offline event listeners
	if (browser) {
		const handleOnline = () => {
			console.log('Connection restored, syncing pending actions...');
			update(state => ({ ...state, isOnline: true }));
			syncPendingActions();
		};

		const handleOffline = () => {
			console.log('Connection lost, entering offline mode');
			update(state => ({ ...state, isOnline: false }));
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Start periodic sync when online
		const startPeriodicSync = () => {
			if (syncInterval) clearInterval(syncInterval);
			
			syncInterval = setInterval(() => {
				const state = get({ subscribe });
				if (state.isOnline && state.pendingActions.length > 0) {
					syncPendingActions();
				}
			}, 30000); // Sync every 30 seconds
		};

		// Load initial state and start sync
		const initialState = loadOfflineState();
		set(initialState);
		
		if (initialState.isOnline && initialState.pendingActions.length > 0) {
			// Sync any pending actions from previous session
			setTimeout(syncPendingActions, 1000);
		}
		
		startPeriodicSync();

		// Cleanup on page unload
		window.addEventListener('beforeunload', () => {
			if (syncInterval) clearInterval(syncInterval);
			retryTimeouts.forEach(timeout => clearTimeout(timeout));
		});
	}

	return {
		subscribe,
		errors: { subscribe: errors.subscribe },

		// Add action to pending queue
		addPendingAction: (type: PendingAction['type'], data: any) => {
			const action: PendingAction = {
				id: generateId(),
				type,
				data,
				timestamp: new Date(),
				retryCount: 0
			};

			update(state => {
				const newState = {
					...state,
					pendingActions: [...state.pendingActions, action]
				};
				saveOfflineState(newState);
				return newState;
			});

			// Try to process immediately if online
			const currentState = get({ subscribe });
			if (currentState.isOnline) {
				setTimeout(async () => {
					const success = await processPendingAction(action);
					if (success) {
						update(state => ({
							...state,
							pendingActions: state.pendingActions.filter(a => a.id !== action.id)
						}));
					} else {
						scheduleRetry(action);
					}
				}, 0);
			}
		},

		// Manually trigger sync
		sync: async () => {
			await syncPendingActions();
		},

		// Clear all pending actions (use with caution)
		clearPending: () => {
			// Clear all retry timeouts
			retryTimeouts.forEach(timeout => clearTimeout(timeout));
			retryTimeouts.clear();

			update(state => {
				const newState = {
					...state,
					pendingActions: []
				};
				saveOfflineState(newState);
				return newState;
			});
		},

		// Remove specific pending action
		removePendingAction: (actionId: string) => {
			const timeout = retryTimeouts.get(actionId);
			if (timeout) {
				clearTimeout(timeout);
				retryTimeouts.delete(actionId);
			}

			update(state => {
				const newState = {
					...state,
					pendingActions: state.pendingActions.filter(a => a.id !== actionId)
				};
				saveOfflineState(newState);
				return newState;
			});
		},

		// Get connection status
		isOnline: () => get({ subscribe }).isOnline,

		// Get pending actions count
		getPendingCount: () => get({ subscribe }).pendingActions.length,

		// Export pending actions for debugging
		exportPending: () => {
			const state = get({ subscribe });
			return JSON.stringify(state.pendingActions, null, 2);
		},

		// Force offline mode (for testing)
		setOffline: (offline: boolean) => {
			update(state => ({ ...state, isOnline: !offline }));
		}
	};
}

// Offline store instance
export const offline = createOfflineStore();

// Derived stores
export const connectionStatus = derived(
	offline,
	($offline) => ({
		isOnline: $offline.isOnline,
		hasPendingActions: $offline.pendingActions.length > 0,
		pendingCount: $offline.pendingActions.length,
		lastSync: $offline.lastSyncTime
	})
);

export const pendingActionsCount = derived(
	offline,
	($offline) => $offline.pendingActions.length
);

export const syncStatus = derived(
	offline,
	($offline) => {
		if (!$offline.isOnline) return 'offline';
		if ($offline.pendingActions.length === 0) return 'synced';
		return 'pending';
	}
);

// Helper function for components to queue actions
export const queueAction = (type: PendingAction['type'], data: any) => {
	offline.addPendingAction(type, data);
};