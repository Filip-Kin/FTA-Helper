import { z } from "zod";
import { eventProcedure, protectedProcedure, publicProcedure, router } from "../trpc";
import { db } from "../db/db";
import { pushSubscriptions, tickets, users, events } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Ticket, Profile} from "../../shared/types";
import { getEvent } from "../util/get-event";
import { observable } from "@trpc/server/observable";
import { sendNotification } from "../util/push-notifications";
import { randomUUID } from "crypto";

export interface TicketPost {
    type: "create" | "assign" | "status";
    data: Ticket;
}

export const ticketsRouter = router({

    getAll: eventProcedure.query(async ({ ctx }) => {
        const event = await getEvent(ctx.eventToken as string);

        const eventTickets = await db.query.tickets.findMany({
             where: eq(tickets.event_code, event.code) 
        });

        if (!eventTickets) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tickets not found" });
        }

        return eventTickets.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });
    }),

    getAllByAuthorID: eventProcedure.input(z.object({
        author_id: z.number()
    })).query(async ({ctx, input}) => {
        const event = await getEvent(ctx.eventToken as string)

        const ticketsByAuthor = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.author_id, input.author_id)
            )
        });

        if (!ticketsByAuthor) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No Tickets found by provided user" });
        }

        return ticketsByAuthor.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),

    getAllByTeam: eventProcedure.input(z.object({
        team_number: z.number()
    })).query(async ({ctx, input}) => {
        const event = await getEvent(ctx.eventToken as string)

        const ticketsByTeam = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code), 
                eq(tickets.team, input.team_number)
            )
        });

        if (!ticketsByTeam) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No Tickets found for provided team" });
        }

        return ticketsByTeam.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),

    getAllByAssignedToId: eventProcedure.input(z.object({
        assigned_to_id: z.number()
    })).query(async ({ctx, input}) => {
        const event = await getEvent(ctx.eventToken as string);

        const ticketsByAssignedTo = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code), 
                eq(tickets.assigned_to_id, input.assigned_to_id)
            )
        });

        if (!ticketsByAssignedTo) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No Tickets found assigned to the provided user" });
        }

        return ticketsByAssignedTo.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),

    getAllUnassigned: eventProcedure.query(async ({ctx}) => {
        const event = await getEvent(ctx.eventToken as string);

        const unassignedTickets = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.assigned_to_id, -1)
            )
        });

        if (!unassignedTickets) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No unassigned Tickets found" });
        }

        return unassignedTickets.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),

    getAllOpen: eventProcedure.query(async ({ctx}) => {
        const event = await getEvent(ctx.eventToken as string);

        const openTickets = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.is_open, true)
            )
        });

        if (!openTickets) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No open Tickets found" });
        }

        return openTickets.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),

    getAllClosed: eventProcedure.query(async ({ctx}) => {
        const event = await getEvent(ctx.eventToken as string);

        const closedTickets = await db.query.tickets.findMany({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.is_open, false)
            )
        });

        if (!closedTickets) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No open Tickets found" });
        }

        return closedTickets.sort((a, b) => {
            let aTime = a.created_at.getTime();
            let bTime = b.created_at.getTime();
            return aTime - bTime;
        });    
    }),


    getAuthorProfile: eventProcedure.input(z.object({
        ticket_id: z.string().uuid(),
    })).query(async ({ctx, input}) => {
        const event = await getEvent(ctx.eventToken as string)

        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.id, input.ticket_id)
            )
        });

        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No Tickets found by provided User" });
        }

        const profile = ticket.author as Profile;
        
        if (!profile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Unable to retrieve author Profile" });
        }

        return profile;
    }),

    getById: protectedProcedure.input(z.object({
        id: z.string().uuid(),
        event_code: z.string()
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.id),
                eq(tickets.event_code, input.event_code),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        return ticket;
    }),

    getAssignedToProfile: eventProcedure.input(z.object({
        ticket_id: z.string().uuid(),
    })).query(async ({ctx, input}) => {
        const event = await getEvent(ctx.eventToken as string)

        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.event_code, event.code),
                eq(tickets.id, input.ticket_id)
            )
        });

        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No Tickets found by provided User" });
        }

        const profile = ticket.assigned_to as Profile | null;
        
        if (!profile) {
            console.log("No profile assigned to this ticket")
        }

        return profile;
    }),

    create: protectedProcedure.input(z.object({
        team: z.number(),
        subject: z.string(),
        text: z.string(),
    })).query(async ({ ctx, input }) => {
        const event = await getEvent(ctx.eventToken as string);

        const authorProfile = await db.query.users.findFirst({
            where: eq(users.id, ctx.user.id)
        });

        if (!authorProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Unable to retrieve author Profile" });
        }

        const insert = await db.insert(tickets).values({
            id: randomUUID(),
            team: input.team,
            subject: input.subject,
            author_id: ctx.user.id,
            author: {
                id: authorProfile.id,
                username: authorProfile.username,
                role: authorProfile.role,
            },
            assigned_to_id: -1,
            is_open: true,
            text: input.text,
            created_at: new Date(),
            updated_at: new Date(),
            messages: '[]',
        }).returning();

        if (!insert[0]) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create Ticket" });
        }

        event.ticketEmitter.emit('create', { 
            ...insert[0], user: { 
                username: ctx.user.username, id: ctx.user.id, role: ctx.user.role 
            } 
        });

        sendNotification(event.users.filter(u => (u !== ctx.user.id)), {
            title: `New Ticket: Team ${input.team}`,
            body: input.subject,
            tag: 'Ticket Created',
            data: {
                page: 'ticket/' + insert[0].id,
            }
        });

        return insert[0];
    }),

    updateStatus: protectedProcedure.input(z.object({
        id: z.string().uuid(),
        new_status: z.boolean(),
        event_code: z.string(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.event_code, input.event_code),
                eq(tickets.id, input.id)
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const update = await db.update(tickets).set({
            is_open: input.new_status,
            closed_at: input.new_status ? new Date() : null
        }).where(eq(tickets.id, input.id)).returning();

        (await getEvent("", ticket.event_code)).ticketEmitter.emit('status', update[0]);

        //update users who follow this ticket
        const followers = ticket.followers as number[];

        sendNotification(followers, {
            title: `Ticket #${ticket.id} ${input.new_status ? "Reopened" : "Closed"}`,
            body: `Team ${ticket.team}`,
            tag: 'Ticket Update',
            data: {
                page: 'ticket/' + ticket.id,
            }
        });

        return update[0];
    }),

    assign: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
        user_id: z.number(),
        assign: z.boolean(),
        event_code: z.string(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.ticket_id),
                eq(tickets.event_code, input.event_code),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const profile = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
        }).from(users).where(eq(users.id, input.user_id));


        if (!profile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Unable to retrieve User profile" });
        }

        if (input.assign && ticket.assigned_to_id === input.user_id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "User is already assigned to this ticket" });
        } else if (!input.assign && ticket.assigned_to_id === -1) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "No user currently assigned to this ticket" });
        }

        const update = await db.update(tickets).set({
            assigned_to_id: input.user_id
        }).where(eq(tickets.id, input.ticket_id)).returning();


        if (!update) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update assignation status" });
        }

        if (input.user_id === -1) {
            (await getEvent("", ticket.event_code)).ticketEmitter.emit('un-assign', {
                 ...update[0], assigned_to_id: input.user_id 
            });
            return null;
        } else {
            (await getEvent("", ticket.event_code)).ticketEmitter.emit('assign', {
                 ...update[0], assigned_to_id: input.user_id 
            });
        }

        if (input.user_id !== ctx.user.id) {
            sendNotification([input.user_id], {
                title: `Ticket #${ticket.id} Assigned to you`,
                body: `You have been assigned to ticket #${ticket.id} for team ${ticket.team}`,
                tag: 'Ticket Update',
                data: {
                    page: 'ticket/' + ticket.id,
                }
            });
        }

        return profile;
    }),

    editText: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
        new_text: z.string(),
        event_code: z.string(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.ticket_id),
                eq(tickets.event_code, input.event_code),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const update = await db.update(tickets).set({
            text: input.new_text
        }).where(eq(tickets.id, input.ticket_id)).returning();

        if (!update) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update Ticket text" });
        }

        return update;
    }),

    editSubject: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
        new_subject: z.string(),
        event_code: z.string(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.ticket_id),
                eq(tickets.event_code, input.event_code),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const update = await db.update(tickets).set({
            text: input.new_subject
        }).where(eq(tickets.id, input.ticket_id)).returning();

        if (!update) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update Ticket subject" });
        }

        return update;
    }),

    follow: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.ticket_id),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        let followers = ticket.followers as number[];

        if (!followers.includes(ctx.user.id)) {
            followers.push(ctx.user.id);
        } else {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Current User is already following provided Ticket" });
        }

        const update = await db.update(tickets).set({
            followers: followers,
        }).where(eq(tickets.id, input.ticket_id)).returning();

        if (!update) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update Ticket followers" });
        }

        return update;
    }),

    unfollow: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: and(
                eq(tickets.id, input.ticket_id),
            )
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const followers = ticket.followers as number[];

        let updatedFollowers: number[] = [];

        if (followers.includes(ctx.user.id)) {
            updatedFollowers = followers.filter(num => num !== ctx.user.id);
        } else {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Current User not following provided Ticket" });
        }

        const update = await db.update(tickets).set({
            followers: updatedFollowers,
        }).where(eq(tickets.id, input.ticket_id)).returning();

        if (!update) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update Ticket followers" });
        }

        return update;
    }),

    delete: protectedProcedure.input(z.object({
        ticket_id: z.string().uuid(),
    })).query(async ({ ctx, input }) => {
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, input.ticket_id),
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        let result;

        if (ticket.messages === null || ticket.is_open === false) {
            result = await db.delete(tickets).where(eq(tickets.id, input.ticket_id));
        } else {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to delete Ticket with linked Messages" });
        }

        if (!result) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to delete Ticket" });
        }

        return result;
    }),

    backgroundSubscription: publicProcedure.input(z.object({
        eventToken: z.string()
    })).subscription(async ({ input }) => {
        const event = await getEvent(input.eventToken);

        return observable<TicketPost>((emitter) => {
            const listener = (type: "create", tkt: Ticket) => {
                emitter.next({
                    type,
                    data: tkt
                });
            };

            event.ticketEmitter.on('create', (tkt) => listener("create", tkt));

            return () => {
                event.ticketEmitter.removeListener('create', (tkt) => listener("create", tkt));
            };
        });
    }),



    foregroundSubscription: publicProcedure.input(z.object({
        eventToken: z.string()
    })).subscription(async ({ input }) => {
        const event = await getEvent(input.eventToken);

        return observable<TicketPost>((emitter) => {
            const listener = (type: "assign" | "status" | "create", tkt: Ticket) => {
                emitter.next({
                    type,
                    data: tkt
                });
            };

            event.ticketEmitter.on('assign', (tkt) => listener("assign", tkt));
            event.ticketEmitter.on('status', (tkt) => listener("status", tkt));
            event.ticketEmitter.on('create', (tkt) => listener("create", tkt));
            return () => {
                event.ticketEmitter.removeListener('assign', (tkt) => listener("assign", tkt));
                event.ticketEmitter.removeListener('status', (tkt) => listener("status", tkt));
                event.ticketEmitter.removeListener('create', (tkt) => listener("create", tkt));
            };
        });
    }),

    ticketSubscription: publicProcedure.input(z.object({
        ticket_id: z.string().uuid(),
        eventToken: z.string(),
        user_id: z.number(),
    })).subscription(async ({ input }) => {
        const authEvent = await getEvent(input.eventToken);

        if (!authEvent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, input.ticket_id)
        });
        
        if (!ticket) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        let event;
        if (authEvent.code !== ticket.event_code) {
            event = await getEvent("", ticket.event_code ?? '');
        } else {
            event = authEvent;
        }

        const followers = ticket.followers as number[];

        if (!followers.includes(input.user_id)){
            throw new TRPCError({ code: "BAD_REQUEST", message: "Already following Ticket" });
        } else {
            followers.push(input.user_id)
        }

        return observable<TicketPost>((emitter) => {
            const listener = (type: "assign" | "status", tkt: Ticket) => {
                if ((tkt.id === input.ticket_id)) {
                    emitter.next({
                        type,
                        data: tkt
                    });
                }
            };

            event.ticketEmitter.on('assign', (tkt) => listener("assign", tkt));
            event.ticketEmitter.on('status', (tkt) => listener("status", tkt));

            return () => {
                event.ticketEmitter.removeListener('assign', (tkt) => listener("assign", tkt));
                event.ticketEmitter.removeListener('status', (tkt) => listener("status", tkt));
            };
        });
    }),

    teamSubscription: publicProcedure.input(z.object({
        team: z.number(),
        eventToken: z.string()
    })).subscription(async ({ input }) => {
        const event = await getEvent(input.eventToken);

        return observable<TicketPost>((emitter) => {
            const listener = (type: "assign" | "status" | "create", tkt: Ticket) => {
                if (tkt.team == input.team) {
                    emitter.next({
                        type,
                        data: tkt
                    });
                }
            };

            event.ticketEmitter.on('assign', (tkt) => listener("assign", tkt));
            event.ticketEmitter.on('status', (tkt) => listener("status", tkt));
            event.ticketEmitter.on('create', (tkt) => listener("create", tkt));

            return () => {
                event.ticketEmitter.removeListener('assign', (tkt) => listener("assign", tkt));
                event.ticketEmitter.removeListener('status', (tkt) => listener("status", tkt));
                event.ticketEmitter.removeListener('create', (tkt) => listener("create", tkt));
            };
        });
    }),

    registerPush: protectedProcedure.input(z.object({
        endpoint: z.string(),
        expirationTime: z.date(),
        keys: z.object({
            p256dh: z.string(),
            auth: z.string()
        })
    })).query(async ({ input, ctx }) => {
        db.insert(pushSubscriptions).values({
            endpoint: input.endpoint,
            expirationTime: input.expirationTime,
            keys: input.keys,
            user_id: ctx.user.id
        }).execute();

        return true;
    }),

});

export async function getEventTickets( event_code: string ) {
    const eventTickets = await db.query.tickets.findMany({
         where: eq(tickets.event_code, event_code) 
    });

    if (!eventTickets) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tickets not found" });
    }

    return eventTickets as Ticket[];
}