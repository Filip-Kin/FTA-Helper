//import 'dotenv/config';
// import webpush from 'web-push';
// import type { PushSubscription, SendResult } from 'web-push';
// import { db } from '../../../src/db/db';
// import { eq, inArray } from 'drizzle-orm';
// import { pushSubscriptions } from '../../../src/db/schema';
 import type { MonitorEvent } from "./monitorFrameHandler";
// import { trpc } from '../../../extension/src/trpc';
// import { toast } from "../../../shared/toast";
// import { userStore } from "../stores/user";
// import { settingsStore } from "../stores/settings";
// import { addNotification } from "../stores/notifications";
// import type { Notification } from "../stores/notifications";
// import { get } from 'svelte/store';
// import type { Ticket } from '../../../shared/types';
//import { get } from '../app/node_modules/svelte/store';

// const publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
// const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';


export function initializePushNotifications() {
    // webpush.setVapidDetails(
    //     'mailto:me@filipkin.com',
    //     publicVapidKey,
    //     privateVapidKey,
    // );
};

export interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: {
        page?: string;
    };
}

export async function sendNotification(data: NotificationData) {
    // const subscription = await db.query.pushSubscriptions.findFirst({ 
    //     where: eq(pushSubscriptions.user_id, get(userStore).id) 
    // });

    // console.log(subscription);

    // const notifications: Promise<SendResult>[] = [];
    
    // console.log('Sending notification to', subscription?.id);
    // if (subscription) {
    //     notifications.push(webpush.sendNotification({
    //         endpoint: subscription.endpoint,
    //         keys: subscription.keys as PushSubscription['keys'],
    //     }, JSON.stringify(data), {
    //         topic: 'push'
    //     }).then(res => {
    //         console.log('Notification sent', res);
    //         return res;
    //     }));
    //     addNotification(data);
    // }

    // await Promise.all(notifications);
}

export function robotNotification(type: string, event: MonitorEvent["detail"]) {
    // const robot = event.frame[event.robot];
    // sendNotification({
    //     title: `${robot.number} Lost ${type.toLocaleUpperCase()}`,
    //     body: `${event.robot} lost ${type} at ${event.frame.time} in ${event.frame.match}.`,
    // });
}

const urlBase64ToUint8Array = (base64String: string) => {
    // const padding = '='.repeat((4 - base64String.length % 4) % 4);
    // const base64 = (base64String + padding)
    //     .replace(/\-/g, '+')
    //     .replace(/_/g, '/');

    // const rawData = window.atob(base64);
    // const outputArray = new Uint8Array(rawData.length);

    // for (let i = 0; i < rawData.length; ++i) {
    //     outputArray[i] = rawData.charCodeAt(i);
    // }
    // return outputArray;
};

export async function subscribeToPush() {
    // try {
    //     if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported');

    //     console.log('Registering service worker');
    //     const registration = await navigator.serviceWorker.ready;

    //     console.log(registration);

    //     // Subscribe to push notifications
    //     const subscription = await registration.pushManager.subscribe({
    //         userVisibleOnly: true,
    //         applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    //     });

    //     const keys = subscription.toJSON().keys ?? {};

    //     // Send push subscription to server
    //     // await trpc.tickets.registerPush.query({
    //     //     endpoint: subscription.endpoint,
    //     //     expirationTime: new Date(subscription.expirationTime ?? 0),
    //     //     keys: {
    //     //         p256dh: keys.p256dh,
    //     //         auth: keys.auth,
    //     //     },
    //     // });
    // } catch (e) {
    //     console.error(e);
    //     toast('Failed to subscribe to push notifications', (e as Error).message);
    // }
}