import { writable } from "svelte/store";

export interface Settings {
    version: string;
    developerMode: boolean;
}

let initialSettings = localStorage.getItem('settings');

const defaultSettings: Settings = {
    version: '0',
    developerMode: false,
};

if (!initialSettings) {
    initialSettings = JSON.stringify(defaultSettings);
} else {
    let parsedSettings = JSON.parse(initialSettings);
    for (const key in defaultSettings) {
        if (parsedSettings[key] === undefined) {
            parsedSettings[key] = defaultSettings[key as keyof Settings];
        }
    }
    initialSettings = JSON.stringify(parsedSettings);
}

export const settingsStore = writable<Settings>(JSON.parse(initialSettings));
settingsStore.subscribe((value: Settings) => {
    if (value === undefined) {
        value = defaultSettings;
    }
    localStorage.setItem('settings', JSON.stringify(value));
});