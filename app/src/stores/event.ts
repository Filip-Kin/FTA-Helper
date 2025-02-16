import { writable } from 'svelte/store';
import type { Profile, TeamList } from '../../../shared/types';

export interface Event {
    code: string;
    pin: string;
    teams: ({ number: string, name: string, inspected: boolean; })[];
    users: Profile[];
    subEvents?: { code: string, label: string, token: string, pin: string, teams: TeamList; }[];
    meshedEventCode?: string;
    label?: string;
}

let initialEvent = localStorage.getItem('event');

if (!initialEvent) {
    initialEvent = JSON.stringify({
        code: '',
        pin: '',
        teams: [],
        users: [],
    });
}

try {
    JSON.parse(initialEvent);
} catch (e) {
    initialEvent = JSON.stringify({
        code: '',
        pin: '',
        teams: [],
        users: [],
    });
}

export const eventStore = writable<Event>(JSON.parse(initialEvent));
eventStore.subscribe((value) => {
    localStorage.setItem('event', JSON.stringify(value));
});
